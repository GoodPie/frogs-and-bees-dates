# Test Utilities - Error Handling Guide

This document outlines the improved error handling strategies implemented for testing React components with Firebase integration.

## Key Improvements

### 1. Global Error Suppression (`setup-test.ts`)

The test setup now includes global error suppression for expected test scenarios:

- **React Warnings**: Suppresses common React warnings like `act()` warnings and missing keys
- **Firebase Errors**: Handles expected Firebase errors during testing
- **Console Noise**: Filters out non-critical warnings like missing license fields

### 2. Error Handling Utilities (`test-utils/errorHandling.ts`)

#### `suppressUnhandledRejections()`
Use this utility when testing error scenarios that intentionally throw errors:

```typescript
import { suppressUnhandledRejections } from '../../../test-utils/errorHandling'

describe('Error Handling', () => {
  let errorSuppression: ReturnType<typeof suppressUnhandledRejections> | null = null

  afterEach(() => {
    if (errorSuppression) {
      errorSuppression.restore()
      errorSuppression = null
    }
  })

  it('should handle Firebase errors gracefully', async () => {
    // Suppress unhandled rejections for this test
    errorSuppression = suppressUnhandledRejections()
    
    // Your test code that triggers errors
    mockGetDocs.mockRejectedValue(createMockFirebaseError('Connection failed'))
    
    // Test continues without unhandled rejection warnings
  })
})
```

#### `createMockFirebaseError()`
Creates properly formatted Firebase errors for testing:

```typescript
const error = createMockFirebaseError('Connection timeout')
mockGetDocs.mockRejectedValue(error)
```

#### `testAsyncError()`
Wrapper for testing async operations that should throw errors:

```typescript
await testAsyncError(
  () => someAsyncFunction(),
  'Expected error message'
)
```

### 3. Error Boundary Testing (`test-utils/ErrorBoundary.tsx`)

For testing component error boundaries:

```typescript
import { TestErrorBoundary } from '../../../test-utils/ErrorBoundary'

it('should handle component errors', () => {
  const onError = vi.fn()
  
  render(
    <TestErrorBoundary onError={onError}>
      <ComponentThatThrows />
    </TestErrorBoundary>
  )
  
  expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  expect(onError).toHaveBeenCalled()
})
```

## Best Practices

### 1. Scoped Error Suppression
- Only suppress errors for specific tests that need it
- Always restore error handling in `afterEach` hooks
- Use the `suppressUnhandledRejections()` utility for controlled suppression

### 2. Expected vs Unexpected Errors
- Suppress expected errors (Firebase connection failures, validation errors)
- Always log unexpected errors for debugging
- Use proper error types (`FirebaseError`, etc.)

### 3. Test Isolation
- Each test should handle its own error suppression
- Clean up error handlers after each test
- Don't let error handling from one test affect others

### 4. Error Scenario Testing
- Test both success and failure paths
- Verify graceful degradation when errors occur
- Ensure components don't crash on errors

## Example: Complete Error Handling Test

```typescript
describe('Component Error Handling', () => {
  let errorSuppression: ReturnType<typeof suppressUnhandledRejections> | null = null

  afterEach(() => {
    if (errorSuppression) {
      errorSuppression.restore()
      errorSuppression = null
    }
  })

  it('should handle Firebase errors gracefully', async () => {
    // 1. Suppress unhandled rejections
    errorSuppression = suppressUnhandledRejections()
    
    // 2. Setup error scenario
    mockGetDocs.mockRejectedValue(createMockFirebaseError('Network error'))
    
    // 3. Render component
    render(<MyComponent />)
    
    // 4. Trigger error scenario
    const button = screen.getByRole('button')
    await user.click(button)
    
    // 5. Verify graceful handling
    await waitFor(() => {
      expect(screen.getByText(/error occurred/i)).toBeInTheDocument()
    })
    
    // 6. Verify component still functions
    expect(screen.getByTestId('fallback-ui')).toBeInTheDocument()
  })
})
```

This approach ensures clean test output while maintaining proper error handling verification.