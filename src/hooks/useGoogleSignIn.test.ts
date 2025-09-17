import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import useGoogleSignIn from './useGoogleSignIn';

const { signInWithPopup } = (global as any).__firebaseMocks;

describe('useGoogleSignIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user on successful popup sign-in', async () => {
    const { result } = renderHook(() => useGoogleSignIn());
    let user: any;
    await act(async () => {
      user = await result.current.signIn();
    });

    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(user).toBeTruthy();
    expect(user.uid).toBe('test-user-id');
  });

  it('handles error path gracefully', async () => {
    signInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-closed-by-user' });
    const { result } = renderHook(() => useGoogleSignIn());
    let user: any;
    await act(async () => {
      user = await result.current.signIn();
    });

    expect(signInWithPopup).toHaveBeenCalled();
    expect(user).toBeNull();
  });
});
