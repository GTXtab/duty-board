import type { CSSProperties } from 'react';

declare module 'react' {
  interface CSSProperties {
    '--hue'?: number;
    '--share'?: string;
  }
}

// Golden-angle steps keep neighbouring columns visually distinct for any block size.
export const personStyle = (index: number): CSSProperties => ({
  '--hue': Math.round((index * 137.5 + 200) % 360),
});
