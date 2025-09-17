import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the toaster
vi.mock('../../components/ui/toaster', () => ({
  toaster: {
    create: vi.fn(),
  },
}));

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn(),
  })),
}));

vi.mock('../../FirebaseConfig', () => ({
  auth: {},
}));

// Import after mocking
import { useGoogleSignIn } from '../useGoogleSignIn';
import { signInWithPopup } from 'firebase/auth';
import { toaster } from '../../components/ui/toaster';

// Create mock user
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
};

describe('useGoogleSignIn', () => {
  const mockSignInWithPopup = vi.mocked(signInWithPopup);
  const mockToasterCreate = vi.mocked(toaster.create);
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default successful mock
    mockSignInWithPopup.mockResolvedValue({ user: mockUser } as any);
  });

  describe('Initial State', () => {
    it('should return initial loading state as false', () => {
      const { result } = renderHook(() => useGoogleSignIn());
      
      expect(result.current.loading).toBe(false);
      expect(typeof result.current.signIn).toBe('function');
    });
  });

  describe('Successful Authentication', () => {
    it('should successfully sign in and return user data', async () => {
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(mockSignInWithPopup).toHaveBeenCalledWith(
        {},
        expect.any(Object)
      );
      expect(signInResult).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).not.toHaveBeenCalled();
    });

    it('should manage loading state correctly during sign-in', async () => {
      const { result } = renderHook(() => useGoogleSignIn());
      
      // Mock a delayed response
      mockSignInWithPopup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: mockUser } as any), 100))
      );

      let signInPromise: Promise<any>;
      
      act(() => {
        signInPromise = result.current.signIn();
      });

      // Should be loading immediately after calling signIn
      expect(result.current.loading).toBe(true);

      await act(async () => {
        await signInPromise;
      });

      // Should not be loading after completion
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle popup closed by user error', async () => {
      const error = { code: 'auth/popup-closed-by-user' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'The sign-in popup was closed before completing.',
      });
    });

    it('should handle popup blocked error', async () => {
      const error = { code: 'auth/popup-blocked' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'Your browser blocked the popup. Enable popups and try again.',
      });
    });

    it('should handle cancelled popup request error', async () => {
      const error = { code: 'auth/cancelled-popup-request' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'Another sign-in attempt is already running.',
      });
    });

    it('should handle network request failed error', async () => {
      const error = { code: 'auth/network-request-failed' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'Network error. Check your connection and retry.',
      });
    });

    it('should handle unknown error with generic message', async () => {
      const error = { code: 'auth/unknown-error' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'Something went wrong. Please try again.',
      });
    });

    it('should handle error without code property', async () => {
      const error = new Error('Generic error');
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in error',
        description: 'Something went wrong. Please try again.',
      });
    });

    it('should reset loading state after error', async () => {
      const error = { code: 'auth/popup-blocked' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null user response from Firebase', async () => {
      mockSignInWithPopup.mockResolvedValue({ user: null } as any);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in failed',
        description: 'No user details were returned.',
      });
    });

    it('should handle undefined user response from Firebase', async () => {
      mockSignInWithPopup.mockResolvedValue({ user: undefined } as any);
      
      const { result } = renderHook(() => useGoogleSignIn());
      
      let signInResult: any;
      
      await act(async () => {
        signInResult = await result.current.signIn();
      });

      expect(signInResult).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockToasterCreate).toHaveBeenCalledWith({
        type: 'error',
        title: 'Sign-in failed',
        description: 'No user details were returned.',
      });
    });
  });

  describe('Duplicate Request Prevention', () => {
    it('should prevent duplicate sign-in requests when already loading', async () => {
      const { result } = renderHook(() => useGoogleSignIn());
      
      // Mock a delayed response
      mockSignInWithPopup.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ user: mockUser } as any), 100))
      );

      let firstSignInPromise: Promise<any>;
      let secondSignInResult: any;
      
      // Start first sign-in
      act(() => {
        firstSignInPromise = result.current.signIn();
      });

      // Try to start second sign-in while first is loading
      await act(async () => {
        secondSignInResult = await result.current.signIn();
      });

      expect(secondSignInResult).toBeNull();
      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);

      // Complete first sign-in
      await act(async () => {
        await firstSignInPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Hook Stability', () => {
    it('should maintain signIn function reference when loading state changes', () => {
      const { result, rerender } = renderHook(() => useGoogleSignIn());
      
      const initialSignIn = result.current.signIn;
      
      // Trigger a re-render
      rerender();
      
      expect(result.current.signIn).toBe(initialSignIn);
    });

    it('should update loading state correctly across multiple calls', async () => {
      const { result } = renderHook(() => useGoogleSignIn());
      
      // First successful sign-in
      await act(async () => {
        await result.current.signIn();
      });
      
      expect(result.current.loading).toBe(false);
      
      // Second sign-in with error
      const error = { code: 'auth/popup-blocked' };
      mockSignInWithPopup.mockRejectedValue(error);
      
      await act(async () => {
        await result.current.signIn();
      });
      
      expect(result.current.loading).toBe(false);
    });
  });
});