// Typed client for server/index.js's Socket.IO protocol. No device scoping — this app
// controls the one PC it's served from, so every event is implicitly "this machine."
// The reconnect/lifecycle handling (bfcache, tab visibility, iOS freeze/resume) is
// generic Socket.IO-on-a-touch-device best practice, independent of the protocol shape.
import { io, type Socket } from 'socket.io-client';

export type VmParamValue = number | boolean | string;

export interface VmStatus {
  connected: boolean;
  type: number | null;
  version: string | null;
}

export interface DesktopAction {
  action: string;
  target?: string;
  args?: string;
}

export interface SocketHandlers {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onVmStatus?: (status: VmStatus) => void;
  onVmState?: (state: Record<string, VmParamValue>) => void;
  onVmUpdate?: (param: string, value: VmParamValue) => void;
  onVmStatePatch?: (params: { param: string; value: VmParamValue }[]) => void;
  onVmLevels?: (levels: number[]) => void;
  onLayout?: (layout: unknown) => void;
  onDesktopIcon?: (target: string, icon: string) => void;
  onError?: (message: string) => void;
}

const RESUME_RECONNECT_DELAY_MS = 150;
const VISIBLE_RECONNECT_DELAY_MS = 500;

let _socket: Socket | null = null;
let _reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let _visibilityTimer: ReturnType<typeof setTimeout> | undefined;
let _lifecycleBound = false;
let _handlers: SocketHandlers = {};

export function initSocket(handlers: SocketHandlers): Socket {
  _handlers = { ...handlers };
  createSocket();
  bindLifecycleHandlers();
  return _socket!;
}

export function vmSet(param: string, value: VmParamValue) {
  _socket?.emit('vm:set', { param, value });
}

export function vmMacro(params: { param: string; value: VmParamValue }[]) {
  _socket?.emit('vm:macro', { params });
}

export function desktopAction(action: DesktopAction) {
  _socket?.emit('desktop:action', action);
}

export function requestDesktopIcon(target: string) {
  if (!target) return;
  _socket?.emit('desktop:icon_request', { target });
}

export function saveLayout(layout: unknown) {
  _socket?.emit('layout:save', layout);
}

export function requestLayout() {
  _socket?.emit('layout:get');
}

export function forceReconnect(reason = 'manual') {
  if (!_socket) {
    createSocket();
    return;
  }

  clearTimeout(_reconnectTimer);
  console.info('[socket] forcing reconnect:', reason);

  if (_socket.connected || _socket.active) {
    _socket.disconnect();
  }

  _reconnectTimer = setTimeout(() => {
    _socket?.connect();
  }, RESUME_RECONNECT_DELAY_MS);
}

function createSocket() {
  if (_socket) detachSocketHandlers(_socket);

  _socket = io({
    transports: ['polling', 'websocket'],
    upgrade: true,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 10000,
  });

  attachSocketHandlers(_socket);
}

function attachSocketHandlers(socket: Socket) {
  socket.on('connect', () => {
    _handlers.onConnect?.();
    requestLayout();
  });

  socket.on('disconnect', (reason: string) => _handlers.onDisconnect?.(reason));
  socket.on('connect_error', (error: Error) => _handlers.onConnectError?.(error));

  socket.on('vm:status', (status: VmStatus) => _handlers.onVmStatus?.(status));
  socket.on('vm:state', (state: Record<string, VmParamValue>) => _handlers.onVmState?.(state));
  socket.on('vm:update', ({ param, value }: { param: string; value: VmParamValue }) =>
    _handlers.onVmUpdate?.(param, value),
  );
  socket.on('vm:state_patch', (params: { param: string; value: VmParamValue }[]) =>
    _handlers.onVmStatePatch?.(params),
  );
  socket.on('vm:levels', (levels: number[]) => _handlers.onVmLevels?.(levels));
  socket.on('layout:data', (layout: unknown) => _handlers.onLayout?.(layout));
  socket.on('desktop:icon', ({ target, icon }: { target: string; icon: string }) =>
    _handlers.onDesktopIcon?.(target, icon),
  );
  socket.on('error', ({ message }: { message: string }) => _handlers.onError?.(message));
}

function detachSocketHandlers(socket: Socket) {
  socket.removeAllListeners();
}

function bindLifecycleHandlers() {
  if (_lifecycleBound) return;
  _lifecycleBound = true;

  window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted) {
      forceReconnect('pageshow-bfcache');
      return;
    }
    scheduleVisibleHealthCheck('pageshow');
  });

  window.addEventListener('pagehide', (event) => {
    clearTimeout(_visibilityTimer);
    if ((event as PageTransitionEvent).persisted) _socket?.disconnect();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      clearTimeout(_visibilityTimer);
      return;
    }
    scheduleVisibleHealthCheck('visibilitychange');
  });

  window.addEventListener('focus', () => scheduleVisibleHealthCheck('focus'));
  window.addEventListener('online', () => forceReconnect('online'));

  // iOS PWA backgrounding lifecycle — not standard DOM events, hence the casts.
  window.addEventListener('freeze', () => _socket?.disconnect());
  document.addEventListener('resume', () => forceReconnect('resume'));
}

function scheduleVisibleHealthCheck(reason: string) {
  clearTimeout(_visibilityTimer);
  _visibilityTimer = setTimeout(() => {
    if (document.visibilityState !== 'visible') return;
    if (!_socket || !_socket.connected) {
      forceReconnect(reason);
      return;
    }
    requestLayout();
  }, VISIBLE_RECONNECT_DELAY_MS);
}
