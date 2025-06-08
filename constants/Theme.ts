export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 28,
  heading: 34,
};

export const Button = {
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.lg,
  borderRadius: 8,
};

const Theme = { Spacing, FontFamily, FontSize, Button };
export default Theme;
