import React, { Component } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, BorderRadius } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
import { reportError } from '@/lib/errorReporting';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, { componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>!</Text>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred. Please try again or restart the app.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetail}>
                <Text style={styles.errorText} numberOfLines={4}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    fontFamily: Fonts.lexend.semiBold,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetail: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.input,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontFamily: Fonts.sourceSans.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: BorderRadius.button,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    fontFamily: Fonts.sourceSans.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
