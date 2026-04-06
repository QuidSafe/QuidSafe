// Minimal react-native mock for vitest
export const Platform = {
  OS: 'web' as const,
  select: (obj: Record<string, unknown>) => obj.web ?? obj.default,
};
