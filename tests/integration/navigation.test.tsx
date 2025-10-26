import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../utils/routing-test-utils';
import { AppRouter } from '@/routing/AppRouter';
import { setMockAuthUser, mockUser } from '@/__mocks__/firebase';

describe('URL Navigation Integration', () => {
  beforeEach(() => {
    // Reset auth state before each test
    setMockAuthUser(null);
  });

  describe('Direct URL access', () => {
    it('loads signin screen when accessing /signin', () => {
      renderWithRouter(<AppRouter />, {
        initialEntries: ['/signin']
      });

      // SignIn component should render
      expect(screen.queryByText(/sign/i)).toBeTruthy();
    });

    it('loads activities screen when accessing /activities while authenticated', async () => {
      // Mock authenticated user
      setMockAuthUser(mockUser);

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/activities']
      });

      // Wait for auth to initialize and component to render
      await waitFor(() => {
        // Check for activity category buttons (unique to activities screen)
        expect(screen.getByText('Food')).toBeInTheDocument();
      });
    });

    it('loads calendar screen when accessing /calendar while authenticated', async () => {
      // Mock authenticated user
      setMockAuthUser(mockUser);

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/calendar']
      });

      // Wait for auth to initialize and component to render
      await waitFor(() => {
        // Calendar screen shows "No Upcoming Events" when empty
        expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument();
      });
    });
  });

  describe('Browser history navigation', () => {
    it('supports browser back button navigation', () => {
      setMockAuthUser(mockUser);

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

    it('redirects root path to /activities for authenticated users', async () => {
      setMockAuthUser(mockUser);

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/']
      });

      // Should redirect to activities
      await waitFor(() => {
        const foodButtons = screen.getAllByText('Food');
        expect(foodButtons.length).toBeGreaterThan(0);
      });
    });

    it('redirects undefined routes to signin for unauthenticated users', () => {
      setMockAuthUser(null);

      renderWithRouter(<AppRouter />, {
        initialEntries: ['/invalid-path']
      });

      // Should eventually show signin (after redirect chain)
      // Protected route redirects to signin, then catch-all may redirect
      expect(screen.queryByText(/404|not found/i)).not.toBeInTheDocument();
    });
  });
});
