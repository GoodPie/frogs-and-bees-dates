import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '../../../test-utils/render'
import SignIn from '../SignIn'
import * as useGoogleSignInModule from '../../hooks/useGoogleSignIn'

// Mock the useGoogleSignIn hook
vi.mock('../../hooks/useGoogleSignIn')

describe('SignIn Component', () => {
  const mockSignIn = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    vi.mocked(useGoogleSignInModule.useGoogleSignIn).mockReturnValue({
      signIn: mockSignIn,
      loading: false,
    })
  })

  describe('Rendering', () => {
    it('should render sign in button with correct text', () => {
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).toBeInTheDocument()
    })

    it('should render heart icon', () => {
      render(<SignIn />)
      
      const heartIcon = screen.getByLabelText('Sign in with Google').querySelector('[aria-hidden="true"]')
      expect(heartIcon).toBeInTheDocument()
    })

    it('should have correct button styling and attributes', () => {
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).toHaveAttribute('aria-label', 'Sign in with Google')
    })
  })

  describe('Google Sign-In Integration', () => {
    it('should call signIn function when button is clicked', async () => {
      const user = userEvent.setup()
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(signInButton)
      
      expect(mockSignIn).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple clicks correctly', async () => {
      const user = userEvent.setup()
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      await user.click(signInButton)
      await user.click(signInButton)
      
      expect(mockSignIn).toHaveBeenCalledTimes(2)
    })
  })

  describe('Loading State', () => {
    it('should show loading state when signing in', () => {
      vi.mocked(useGoogleSignInModule.useGoogleSignIn).mockReturnValue({
        signIn: mockSignIn,
        loading: true,
      })
      
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).toHaveAttribute('data-loading', '')
    })

    it('should not show loading state when not signing in', () => {
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).not.toHaveAttribute('data-loading')
    })

    it('should disable button interactions during loading', () => {
      vi.mocked(useGoogleSignInModule.useGoogleSignIn).mockReturnValue({
        signIn: mockSignIn,
        loading: true,
      })
      
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      expect(signInButton).toHaveAttribute('aria-label', 'Sign in with Google')
    })

    it('should have heart icon marked as decorative', () => {
      render(<SignIn />)
      
      const heartIcon = screen.getByLabelText('Sign in with Google').querySelector('[aria-hidden="true"]')
      expect(heartIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<SignIn />)
      
      const signInButton = screen.getByRole('button', { name: /sign in with google/i })
      
      // Focus the button with tab
      await user.tab()
      expect(signInButton).toHaveFocus()
      
      // Activate with Enter key
      await user.keyboard('{Enter}')
      expect(mockSignIn).toHaveBeenCalledTimes(1)
    })
  })
})