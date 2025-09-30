// Consistent spacing system
export const spacing = {
  xs: "gap-1", // 4px
  sm: "gap-2", // 8px
  md: "gap-3", // 12px
  lg: "gap-4", // 16px
  xl: "gap-6", // 24px
  "2xl": "gap-8", // 32px
  "3xl": "gap-12", // 48px
} as const;

export const padding = {
  xs: "p-1", // 4px
  sm: "p-2", // 8px
  md: "p-3", // 12px
  lg: "p-4", // 16px
  xl: "p-6", // 24px
  "2xl": "p-8", // 32px
  "3xl": "p-12", // 48px
} as const;

export const margin = {
  xs: "m-1", // 4px
  sm: "m-2", // 8px
  md: "m-3", // 12px
  lg: "m-4", // 16px
  xl: "m-6", // 24px
  "2xl": "m-8", // 32px
  "3xl": "m-12", // 48px
} as const;

export type SpacingSize = keyof typeof spacing;
export type PaddingSize = keyof typeof padding;
export type MarginSize = keyof typeof margin;
