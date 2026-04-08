import { useWindowDimensions, Platform } from 'react-native';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface ResponsiveLayout {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isWeb: boolean;
  contentMaxWidth: number;
  width: number;
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  let breakpoint: Breakpoint;
  let contentMaxWidth: number;

  if (width >= 1440) {
    breakpoint = 'wide';
    contentMaxWidth = 1120;
  } else if (width >= 1024) {
    breakpoint = 'desktop';
    contentMaxWidth = 960;
  } else if (width >= 768) {
    breakpoint = 'tablet';
    contentMaxWidth = 720;
  } else {
    breakpoint = 'mobile';
    contentMaxWidth = 480;
  }

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    isWide: breakpoint === 'wide',
    isWeb,
    contentMaxWidth,
    width,
  };
}
