// Mount once at the app root. Wires socket.ts's event handlers straight into the two
// stores — this is the only place server events and store writes meet.
import { useEffect } from 'react';
import { initSocket } from '@/lib/socket';
import { useVoiceMeeterStore } from '@/stores/useVoiceMeeterStore';
import { useLayoutStore } from '@/stores/useLayoutStore';

export function useDecklingSocket() {
  useEffect(() => {
    const vm = useVoiceMeeterStore.getState();
    const layout = useLayoutStore.getState();

    initSocket({
      onVmStatus: vm.setStatus,
      onVmState: vm.setState,
      onVmUpdate: vm.applyUpdate,
      onVmStatePatch: vm.applyPatch,
      onVmLevels: vm.setLevels,
      onLayout: (data) => layout.setLayout(data as { pages: typeof layout.pages }),
      onError: (message) => console.error('[server]', message),
    });
  }, []);
}
