import { vi } from 'vitest'

/**
 * Utility to suppress unhandled promise rejections during testing
 * Use this when testing error scenarios that intentionally throw errors
 */
export const suppressUnhandledRejections = () => {
    const originalConsoleError = console.error

    // Mock console.error to suppress error logs
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

    // Add a temporary handler for unhandled rejections
    const rejectionHandler = (reason: any) => {
        // Silently handle the rejection during tests
        if (reason instanceof Error && (
            reason.message.includes('Firebase') ||
            reason.name === 'FirebaseError'
        )) {
            // Expected test error, ignore it completely
            return
        }
        // For unexpected errors, still log them
        originalConsoleError('Unexpected unhandled rejection:', reason)
    }

    process.on('unhandledRejection', rejectionHandler)

    return {
        restore: () => {
            consoleErrorSpy.mockRestore()
            process.removeListener('unhandledRejection', rejectionHandler)
        }
    }
}

/**
 * Wrapper for testing async operations that may throw errors
 * This ensures errors are properly caught and don't become unhandled rejections
 */
export const testAsyncError = async (asyncFn: () => Promise<any>, expectedError?: string) => {
    try {
        await asyncFn()
        throw new Error('Expected function to throw an error')
    } catch (error) {
        if (expectedError && error instanceof Error) {
            if (!error.message.includes(expectedError)) {
                throw new Error(`Expected error message to contain "${expectedError}", but got "${error.message}"`)
            }
        }
        return error
    }
}

/**
 * Mock Firebase operations with proper error handling
 */
export const createMockFirebaseError = (message: string = 'Firebase error') => {
    const error = new Error(message)
    error.name = 'FirebaseError'
    return error
}