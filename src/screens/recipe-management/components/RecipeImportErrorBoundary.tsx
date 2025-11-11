/**
 * Error Boundary Component for Recipe Import
 * Catches React rendering errors and displays recovery UI
 * @module components/RecipeImportErrorBoundary
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Button, Heading, Text, Code, Stack } from '@chakra-ui/react';

/**
 * Props for RecipeImportErrorBoundary component
 */
interface RecipeImportErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;

  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Optional custom fallback UI */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

/**
 * State for RecipeImportErrorBoundary component
 */
interface RecipeImportErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;

  /** The caught error object */
  error: Error | null;

  /** React error info with component stack */
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for Recipe Import feature
 * Catches errors during rendering and provides recovery UI
 *
 * @example
 * ```tsx
 * <RecipeImportErrorBoundary
 *   onError={(error, errorInfo) => {
 *     console.error('Recipe import error:', error, errorInfo);
 *   }}
 * >
 *   <RecipeImportModal />
 * </RecipeImportErrorBoundary>
 * ```
 */
export class RecipeImportErrorBoundary extends Component<
  RecipeImportErrorBoundaryProps,
  RecipeImportErrorBoundaryState
> {
  constructor(props: RecipeImportErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method to update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<RecipeImportErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called when an error is caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('RecipeImportErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send error to monitoring service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Resets the error boundary state
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Renders custom fallback if provided, otherwise renders default error UI
   */
  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <Box
          p={6}
          borderRadius="md"
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
        >
          <Stack gap={4}>
            <Heading size="md" color="red.700">
              Something went wrong
            </Heading>

            <Text color="red.600">
              An unexpected error occurred while loading the recipe import feature.
              This has been logged and we'll look into it.
            </Text>

            <Box>
              <Text fontWeight="semibold" mb={2} color="red.700">
                Error details:
              </Text>
              <Code
                display="block"
                p={3}
                borderRadius="md"
                bg="red.100"
                color="red.800"
                fontSize="sm"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
              >
                {this.state.error.message}
              </Code>
            </Box>

            {this.state.errorInfo && (
              <Box>
                <Text fontWeight="semibold" mb={2} color="red.700">
                  Component stack:
                </Text>
                <Code
                  display="block"
                  p={3}
                  borderRadius="md"
                  bg="red.100"
                  color="red.800"
                  fontSize="xs"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  maxH="200px"
                  overflowY="auto"
                >
                  {this.state.errorInfo.componentStack}
                </Code>
              </Box>
            )}

            <Box>
              <Button
                colorScheme="red"
                onClick={this.handleReset}
                size="md"
              >
                Try Again
              </Button>
            </Box>

            <Text fontSize="sm" color="red.600">
              If this problem persists, try refreshing the page or contact support.
            </Text>
          </Stack>
        </Box>
      );
    }

    // No error, render children
    return this.props.children;
  }
}

/**
 * Simplified error boundary using function component pattern (React 19+)
 * This is a modern alternative that uses hooks and is easier to test
 *
 * Note: This is a conceptual example. React 19 doesn't have built-in error boundary hooks yet,
 * so we'll keep the class component above as the main implementation.
 */

/**
 * Hook-based error boundary wrapper (future implementation when React supports it)
 * For now, use the class-based RecipeImportErrorBoundary above
 */
export function withRecipeImportErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, reset: () => void) => ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <RecipeImportErrorBoundary fallback={fallback}>
        <Component {...props} />
      </RecipeImportErrorBoundary>
    );
  };
}

/**
 * Default fallback UI for errors
 * Can be used as a custom fallback prop
 */
export function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactNode {
  return (
    <Box p={6} textAlign="center">
      <Heading size="lg" mb={4} color="red.600">
        Oops! Something went wrong
      </Heading>
      <Text mb={4} color="gray.600">
        {error.message}
      </Text>
      <Button onClick={reset} colorScheme="blue">
        Try Again
      </Button>
    </Box>
  );
}

/**
 * Minimal error fallback for inline display
 */
export function MinimalErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactNode {
  return (
    <Box p={4} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
      <Text color="red.600" mb={2}>
        Error: {error.message}
      </Text>
      <Button size="sm" onClick={reset} colorScheme="red" variant="outline">
        Retry
      </Button>
    </Box>
  );
}
