import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn helper — components generated via `shadcn add` import this.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
