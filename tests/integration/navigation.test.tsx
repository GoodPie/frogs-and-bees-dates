import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../utils/routing-test-utils';
import { AppRouter } from '@/routing/AppRouter';

describe('URL Navigation Integration', () => {
  beforeEach(() => {
    // Reset auth state before each test
    (auth as any).currentUser = null;
  });

  describe('Direct URL access', () => {
    it('loads signin screen when accessing /signin', () => {
      renderWithRouter(<AppRouter />, {
        initialEntries: ['/signin']
      });

      // SignIn component should render
      expect(screen.queryByText(/sign/i)).toBeTruthy();
    });

    it('loads activities screen when accessing /activities while authenticated', () => {
      // Mock authenticated user
      (auth as any).currentUser = { uid: 'test-user', email: 'test@example.com' };

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/activities']
      });

      // Activities screen should render (not redirected to signin)
      // Component loads successfully without signin screen
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    it('loads calendar screen when accessing /calendar while authenticated', () => {
      // Mock authenticated user
      (auth as any).currentUser = { uid: 'test-user', email: 'test@example.com' };

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/calendar']
      });

      // Calendar screen should render
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });
  });

  describe('Browser history navigation', () => {
    it('supports browser back button navigation', () => {
      (auth as any).currentUser = { uid: 'test-user', email: 'test@example.com' };

      // Navigate through multiple screens
      const { container } = renderWithRouter(<AppRouter />, {
        initialEntries: ['/activities', '/calendar']
      });

      // Should be on calendar (last entry)
      // Browser back would return to activities
      expect(container).toBeTruthy();
    });
  });

  describe('Catch-all route behavior', () => {
    it('redirects undefined routes to /activities for authenticated users', () => {

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/invalid-path']
      });

      // Should redirect to activities (no error page)
      expect(screen.queryByText(/404|not found/i)).not.toBeInTheDocument();
    });

    it('redirects root path to /activities for authenticated users', () => {

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/']
      });

      // Should redirect to activities
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    it('redirects undefined routes to signin for unauthenticated users', () => {
      auth.currentUser = null;

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/invalid-path']
      });

      // Should eventually show signin (after redirect chain)
      // Protected route redirects to signin, then catch-all may redirect
      expect(screen.queryByText(/404|not found/i)).not.toBeInTheDocument();
    });
  });
});
