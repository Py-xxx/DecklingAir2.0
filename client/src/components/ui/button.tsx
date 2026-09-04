// Primitive. Source: hand-written (no Base UI yet — see ELEMENTS.md §2 for why).
// Variants: default secondary outline ghost destructive. Sizes: sm default lg icon.
// Every size meets the 40x40 touch floor from deckling-interface-polish/surfaces.md —
// this app has no density exemption for controls the user directly touches.
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

// Tailwind v4 arbitrary-property syntax for a CSS custom property is `prop-(--var)`, not
// `prop-[--var]` — see .claude/design/ELEMENTS.md §5 (the same trap bit the z-index scale).
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow-(--shadow-border) hover:brightness-110',
  secondary: 'bg-secondary text-secondary-foreground shadow-(--shadow-border) hover:bg-bg-elevated',
  outline: 'border border-line bg-transparent text-ink hover:bg-bg-elevated',
  ghost: 'bg-transparent text-ink hover:bg-bg-elevated',
  destructive: 'bg-accent-red text-ink hover:brightness-110',
};

// icon-sm intentionally omitted — nothing in this app may go below the 40px floor.
const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'h-10 px-3 text-sm gap-1.5',
  default: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables press-scale for dense rows / composed controls (e.g. inside StripPanel). */
  static?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', static: isStatic, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-sans font-medium',
        'transition-[background-color,box-shadow,filter] duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        'disabled:pointer-events-none disabled:opacity-40',
        !isStatic && 'active:scale-[0.96]',
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
