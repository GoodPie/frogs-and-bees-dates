import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import * as ReactRouterDom from 'react-router-dom';

describe('useAuthRedirect', () => {
  it('redirects to default route when no intended destination', () => {
    const mockNavigate = vi.fn();
    vi.spyOn(ReactRouterDom, 'useNavigate').mockReturnValue(mockNavigate);
    vi.spyOn(ReactRouterDom, 'useLocation').mockReturnValue({
      pathname: '/signin',
      state: {},
      search: '',
      hash: '',
      key: 'default',
    });

    const { result } = renderHook(() => useAuthRedirect(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    result.current.redirectAfterLogin();

    expect(mockNavigate).toHaveBeenCalledWith('/activities', { replace: true });
  });

  it('redirects to intended destination from location state', () => {
    const mockNavigate = vi.fn();
    vi.spyOn(ReactRouterDom, 'useNavigate').mockReturnValue(mockNavigate);
    vi.spyOn(ReactRouterDom, 'useLocation').mockReturnValue({
      pathname: '/signin',
      state: { from: { pathname: '/calendar' } },
      search: '',
      hash: '',
      key: 'default',
    });

    const { result } = renderHook(() => useAuthRedirect(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    result.current.redirectAfterLogin();

    expect(mockNavigate).toHaveBeenCalledWith('/calendar', { replace: true });
  });

  it('uses replace flag to prevent back button loops', () => {
    const mockNavigate = vi.fn();
    vi.spyOn(ReactRouterDom, 'useNavigate').mockReturnValue(mockNavigate);
    vi.spyOn(ReactRouterDom, 'useLocation').mockReturnValue({
      pathname: '/signin',
      state: {},
      search: '',
      hash: '',
      key: 'default',
    });

    const { result } = renderHook(() => useAuthRedirect(), {
      wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
    });

    result.current.redirectAfterLogin();

    expect(mockNavigate).toHaveBeenCalledWith(expect.any(String), { replace: true });
  });
});
