# Firebase Mocking Infrastructure

This directory contains comprehensive Firebase v9 modular SDK mocks for unit testing. The mocks are automatically configured in `setup-test.ts` and are available globally in all tests.

## Overview

The Firebase mocking infrastructure provides:

- **Complete Firebase v9 SDK mocking** for Auth, Firestore, Analytics, and Messaging
- **Global mock availability** via `global.__firebaseMocks`
- **Automatic mock reset** between tests
- **Helper functions** for common test scenarios
- **Type-safe mocks** with proper TypeScript support

## Usage

### Basic Usage

The mocks are automatically available in all tests. No additional setup is required.

```typescript
import { describe, it, expect } from 'vitest';
import { signInWithPopup, getAuth } from 'firebase/auth';

describe('My Component', () => {
  it('should handle Firebase auth', async () => {
    // Mock successful sign in
    global.__firebaseMocks.signInWithPopup.mockResolvedValueOnce({
      user: { uid: 'test-user', email: 'test@example.com' }
    });
    
    const result = await signInWithPopup(getAuth(), provider);
    expect(result.user.uid).toBe('test-user');
  });
});
```

### Available Mocks

#### Firebase Auth
- `getAuth()` - Returns mock auth instance
- `signInWithPopup()` - Mock sign in function
- `onAuthStateChanged()` - Mock auth state listener
- `GoogleAuthProvider` - Mock provider class

#### Firestore
- `getFirestore()` - Returns mock database instance
- `doc()` - Mock document reference
- `setDoc()` - Mock document write
- `getDoc()` - Mock document read
- `addDoc()` - Mock document creation
- `updateDoc()` - Mock document update
- `deleteDoc()` - Mock document deletion
- `collection()` - Mock collection reference
- `getDocs()` - Mock collection query
- `query()`, `where()`, `orderBy()` - Mock query builders

#### Analytics & Messaging
- `getAnalytics()` - Mock analytics instance
- `logEvent()` - Mock event logging
- `getMessaging()` - Mock messaging instance
- `getToken()` - Mock token retrieval

### Helper Functions

#### Authentication Helpers

```typescript
import { setMockUser, clearMockUser, mockAuthStateChange } from '../__mocks__/firebase';

// Set a mock authenticated user
setMockUser({
  uid: 'test-user',
  email: 'test@example.com',
  displayName: 'Test User'
});

// Clear the authenticated user
clearMockUser();

// Trigger auth state change
mockAuthStateChange(mockUser);
```

#### Firestore Helpers

```typescript
import { mockFirestoreData } from '../__mocks__/firebase';

// Mock Firestore query results
mockFirestoreData([
  { id: '1', name: 'Activity 1', type: 'food' },
  { id: '2', name: 'Activity 2', type: 'movie' }
]);

// Now getDocs() will return these documents
const snapshot = await getDocs(collection(db, 'activities'));
expect(snapshot.size).toBe(2);
```

### Mock Configuration

#### Custom Mock Responses

```typescript
// Mock successful Firestore operations
global.__firebaseMocks.setDoc.mockResolvedValueOnce(undefined);
global.__firebaseMocks.addDoc.mockResolvedValueOnce({ id: 'new-doc-id' });

// Mock Firestore errors
global.__firebaseMocks.getDocs.mockRejectedValueOnce(new Error('Network error'));

// Mock auth errors
global.__firebaseMocks.signInWithPopup.mockRejectedValueOnce(new Error('Popup blocked'));
```

#### Verifying Mock Calls

```typescript
// Verify Firebase functions were called
expect(global.__firebaseMocks.signInWithPopup).toHaveBeenCalled();
expect(global.__firebaseMocks.setDoc).toHaveBeenCalledWith(
  expect.any(Object),
  { name: 'Test Activity' }
);
```

## Mock Reset

Mocks are automatically reset between tests using the `resetFirebaseMocks()` function in `beforeEach`. This ensures:

- All mock call counts are reset to 0
- Mock implementations return to defaults
- Auth state is cleared
- Firestore data is cleared

## Integration with Components

The mocks work seamlessly with components that import Firebase from `FirebaseConfig.tsx`:

```typescript
// Component code
import { auth, db } from '../FirebaseConfig';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Test code - mocks are automatically applied
import { render } from '@testing-library/react';
import MyComponent from '../MyComponent';

test('component uses Firebase', () => {
  render(<MyComponent />);
  // Firebase calls in the component will use mocks
});
```

## Best Practices

### 1. Use Specific Mock Implementations

```typescript
// Good - specific mock for this test
global.__firebaseMocks.getDocs.mockResolvedValueOnce({
  docs: [{ id: '1', data: () => ({ name: 'Test' }) }],
  empty: false,
  size: 1
});

// Avoid - relying on default mock behavior
```

### 2. Test Error Scenarios

```typescript
// Test Firebase error handling
global.__firebaseMocks.signInWithPopup.mockRejectedValueOnce(
  new Error('auth/popup-blocked')
);
```

### 3. Verify Firebase Integration

```typescript
// Verify your component calls Firebase correctly
expect(global.__firebaseMocks.setDoc).toHaveBeenCalledWith(
  expect.objectContaining({ path: 'activities/test-id' }),
  expect.objectContaining({ name: 'Test Activity' })
);
```

### 4. Use Helper Functions

```typescript
// Use helpers for common scenarios
setMockUser(mockUser);
mockFirestoreData(testActivities);

// Instead of manually configuring mocks
```

## Troubleshooting

### Mock Not Working

If Firebase mocks aren't working:

1. Ensure you're importing Firebase functions, not the Firebase config directly
2. Check that `setup-test.ts` is being loaded by Vitest
3. Verify the mock is configured in `setup-test.ts`

### TypeScript Errors

If you get TypeScript errors:

1. Ensure `firebase.d.ts` is included in your TypeScript config
2. Check that `global.__firebaseMocks` is properly typed
3. Import mock helpers with proper types

### Test Isolation Issues

If tests are affecting each other:

1. Verify `resetFirebaseMocks()` is called in `beforeEach`
2. Check that you're not modifying global mock state
3. Use specific mock implementations for each test

## Adding New Firebase Services

To add mocks for new Firebase services:

1. Add the service mock to `firebase.ts`
2. Add the vi.mock() configuration in `setup-test.ts`
3. Add helper functions if needed
4. Update this documentation

Example for Firebase Storage:

```typescript
// In firebase.ts
export const mockStorage = {};
// Add to firebaseMocks object

// In setup-test.ts
vi.mock('firebase/storage', () => ({
  getStorage: firebaseMocks.getStorage,
  ref: firebaseMocks.ref,
  uploadBytes: firebaseMocks.uploadBytes,
}));
```