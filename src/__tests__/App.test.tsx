import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '@/App'
import { render } from '../../test-utils'
import { createMockUser } from '../../test-utils'

// Mock the screen components first
vi.mock('../screens/SignIn', () => ({
  default: () => <div data-testid="signin-screen">Sign In Screen</div>
}))

vi.mock('../screens/ActivitySelection', () => ({
  default: () => <div data-testid="activity-selection-screen">Activity Selection Screen</div>
}))

vi.mock('../screens/ViewCalendar', () => ({
  default: () => <div data-testid="view-calendar-screen">View Calendar Screen</div>
}))

vi.mock('../components/FrogImage', () => ({
  default: () => <div data-testid="frog-image">Frog Image</div>
}))

vi.mock('../ColorModeSwitcher', () => ({
  ColorModeSwitcher: () => <div data-testid="color-mode-switcher">Color Mode Switcher</div>
}))

// Mock Firebase config using global Firebase mocks
vi.mock('../FirebaseConfig', () => {
  const firebaseMocks = (global as any).__firebaseMocks
  return {
    auth: firebaseMocks.auth,
    RegisterFirebaseToken: vi.fn()
  }
})

describe('App Component', () => {
  const user = userEvent.setup()
  const mockUser = createMockUser()

  // Get access to the global Firebase mocks
  const firebaseMocks = (global as any).__firebaseMocks

  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset the mocked auth state using global mocks
    firebaseMocks.auth.currentUser = null
    firebaseMocks.auth.onAuthStateChanged.mockClear()
  })

  describe('Authentication State Management', () => {
    it('should render SignIn screen when user is not authenticated', async () => {
      // Arrange: No authenticated user
      firebaseMocks.auth.currentUser = null

      // Act
      render(<App />)

      // Assert
      expect(screen.getByTestId('signin-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('activity-selection-screen')).not.toBeInTheDocument()
      expect(screen.queryByTestId('view-calendar-screen')).not.toBeInTheDocument()
    })

    it('should render ActivitySelection screen when user is authenticated', async () => {
      // Arrange: Set authenticated user
      firebaseMocks.auth.currentUser = mockUser

      // Act
      render(<App />)

      // Assert
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('signin-screen')).not.toBeInTheDocument()
    })

    it('should set up auth state change listener on mount', async () => {
      // Act
      render(<App />)

      // Assert
      expect(firebaseMocks.auth.onAuthStateChanged).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should update authentication state when auth state changes', async () => {
      // Arrange: Start with no user
      firebaseMocks.auth.currentUser = null
      render(<App />)

      // Verify initial state
      expect(screen.getByTestId('signin-screen')).toBeInTheDocument()

      // Act: Simulate auth state change to authenticated by calling the callback
      await act(async () => {
        firebaseMocks.auth.currentUser = mockUser
        const authCallback = firebaseMocks.auth.onAuthStateChanged.mock.calls[0]?.[0]
        if (authCallback) {
          authCallback(mockUser)
        }
      })

      // Assert: Should now show authenticated content
      await waitFor(() => {
        expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()
        expect(screen.queryByTestId('signin-screen')).not.toBeInTheDocument()
      })
    })

    it('should update authentication state when user signs out', async () => {
      // Arrange: Start with authenticated user
      firebaseMocks.auth.currentUser = mockUser
      render(<App />)

      // Verify initial state
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()

      // Act: Simulate auth state change to unauthenticated
      await act(async () => {
        firebaseMocks.auth.currentUser = null
        const authCallback = firebaseMocks.auth.onAuthStateChanged.mock.calls[0]?.[0]
        if (authCallback) {
          authCallback(null)
        }
      })

      // Assert: Should now show sign in screen
      await waitFor(() => {
        expect(screen.getByTestId('signin-screen')).toBeInTheDocument()
        expect(screen.queryByTestId('activity-selection-screen')).not.toBeInTheDocument()
      })
    })
  })

  describe('Calendar Toggle Functionality', () => {
    beforeEach(async () => {
      // Set authenticated user for these tests
      firebaseMocks.auth.currentUser = mockUser
    })

    it('should initially show ActivitySelection screen when authenticated', () => {
      // Act
      render(<App />)

      // Assert
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('view-calendar-screen')).not.toBeInTheDocument()
    })

    it('should render calendar toggle button', () => {
      // Act
      render(<App />)

      // Assert
      const toggleButton = screen.getByRole('button', { name: /view calendar/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should switch to ViewCalendar screen when toggle button is clicked', async () => {
      // Arrange
      render(<App />)
      const toggleButton = screen.getByRole('button', { name: /view calendar/i })

      // Act
      await user.click(toggleButton)

      // Assert
      expect(screen.getByTestId('view-calendar-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('activity-selection-screen')).not.toBeInTheDocument()
    })

    it('should switch back to ActivitySelection screen when toggle button is clicked again', async () => {
      // Arrange
      render(<App />)
      const toggleButton = screen.getByRole('button', { name: /view calendar/i })

      // Act: Toggle to calendar view
      await user.click(toggleButton)
      expect(screen.getByTestId('view-calendar-screen')).toBeInTheDocument()

      // Act: Toggle back to activity selection
      await user.click(toggleButton)

      // Assert
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('view-calendar-screen')).not.toBeInTheDocument()
    })

    it('should maintain toggle state across multiple clicks', async () => {
      // Arrange
      render(<App />)
      const toggleButton = screen.getByRole('button', { name: /view calendar/i })

      // Act & Assert: Multiple toggles
      // Start with ActivitySelection
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()

      // Toggle to Calendar
      await user.click(toggleButton)
      expect(screen.getByTestId('view-calendar-screen')).toBeInTheDocument()

      // Toggle back to ActivitySelection
      await user.click(toggleButton)
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()

      // Toggle to Calendar again
      await user.click(toggleButton)
      expect(screen.getByTestId('view-calendar-screen')).toBeInTheDocument()
    })
  })

  describe('Firebase Token Refresh Button', () => {
    it('should render refresh notification button', () => {
      // Act
      render(<App />)

      // Assert
      const refreshButton = screen.getByRole('button', { name: /refresh notification/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('should call RegisterFirebaseToken when refresh button is clicked', async () => {
      // Arrange
      const { RegisterFirebaseToken } = await import('../FirebaseConfig')
      render(<App />)
      const refreshButton = screen.getByRole('button', { name: /refresh notification/i })

      // Act
      await user.click(refreshButton)

      // Assert
      expect(RegisterFirebaseToken).toHaveBeenCalledTimes(1)
    })

    it('should be accessible regardless of authentication state', async () => {
      // Test with unauthenticated user
      firebaseMocks.auth.currentUser = null
      const { rerender } = render(<App />)
      expect(screen.getByRole('button', { name: /refresh notification/i })).toBeInTheDocument()

      // Test with authenticated user
      firebaseMocks.auth.currentUser = mockUser
      rerender(<App />)
      expect(screen.getByRole('button', { name: /refresh notification/i })).toBeInTheDocument()
    })
  })

  describe('Component Rendering', () => {
    it('should always render ColorModeSwitcher', async () => {
      // Test with unauthenticated user
      firebaseMocks.auth.currentUser = null
      const { rerender } = render(<App />)
      expect(screen.getByTestId('color-mode-switcher')).toBeInTheDocument()

      // Test with authenticated user
      firebaseMocks.auth.currentUser = mockUser
      rerender(<App />)
      expect(screen.getByTestId('color-mode-switcher')).toBeInTheDocument()
    })

    it('should always render FrogImage', async () => {
      // Test with unauthenticated user
      firebaseMocks.auth.currentUser = null
      const { rerender } = render(<App />)
      expect(screen.getByTestId('frog-image')).toBeInTheDocument()

      // Test with authenticated user
      firebaseMocks.auth.currentUser = mockUser
      rerender(<App />)
      expect(screen.getByTestId('frog-image')).toBeInTheDocument()
    })

    it('should render with ChakraProvider wrapper', () => {
      // Act
      render(<App />)

      // Assert: Check that the component renders without errors by verifying core elements
      expect(screen.getByTestId('color-mode-switcher')).toBeInTheDocument()
      expect(screen.getByTestId('frog-image')).toBeInTheDocument()
    })

    it('should have proper layout structure', async () => {
      // Arrange
      firebaseMocks.auth.currentUser = mockUser

      // Act
      render(<App />)

      // Assert: Check that main content renders properly
      const activityScreen = screen.getByTestId('activity-selection-screen')
      expect(activityScreen).toBeInTheDocument()

      // Verify the content is within the expected layout structure
      expect(activityScreen).toBeVisible()
    })
  })

  describe('ActionButton Component Logic', () => {
    beforeEach(async () => {
      firebaseMocks.auth.currentUser = mockUser
    })

    it('should render ActivitySelection when isViewingCalendar is false', () => {
      // Act
      render(<App />)

      // Assert
      expect(screen.getByTestId('activity-selection-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('view-calendar-screen')).not.toBeInTheDocument()
    })

    it('should render ViewCalendar when isViewingCalendar is true', async () => {
      // Arrange
      render(<App />)
      const toggleButton = screen.getByRole('button', { name: /view calendar/i })

      // Act
      await user.click(toggleButton)

      // Assert
      expect(screen.getByTestId('view-calendar-screen')).toBeInTheDocument()
      expect(screen.queryByTestId('activity-selection-screen')).not.toBeInTheDocument()
    })
  })
})