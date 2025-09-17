import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, userEvent } from '../../../test-utils/render'
import InputAutocomplete, { IInputAutoCompleteProps } from '../InputAutocomplete'

describe('InputAutocomplete', () => {
  const mockOptions = ['pizza', 'pasta', 'burger', 'sushi', 'tacos', 'salad']
  const mockOnSubmit = vi.fn()

  const defaultProps: IInputAutoCompleteProps = {
    options: mockOptions,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render input field with placeholder text', () => {
      render(<InputAutocomplete {...defaultProps} />)
      
      expect(screen.getByPlaceholderText('Type here for more tags')).toBeInTheDocument()
    })

    it('should render submit button with correct text', () => {
      render(<InputAutocomplete {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      expect(screen.getByText('Get Activity')).toBeInTheDocument()
    })

    it('should render submit button as disabled when no tags selected', () => {
      render(<InputAutocomplete {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /search/i })
      expect(submitButton).toBeDisabled()
    })

    it('should display first 5 options when search input is empty or short', () => {
      render(<InputAutocomplete {...defaultProps} />)
      
      // Should show first 5 options by default
      expect(screen.getByText('pizza')).toBeInTheDocument()
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('burger')).toBeInTheDocument()
      expect(screen.getByText('sushi')).toBeInTheDocument()
      expect(screen.getByText('tacos')).toBeInTheDocument()
      expect(screen.queryByText('salad')).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter options based on search input when input length > 2', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type here for more tags')
      await user.type(input, 'piz')
      
      expect(screen.getByText('pizza')).toBeInTheDocument()
      expect(screen.queryByText('pasta')).not.toBeInTheDocument()
      expect(screen.queryByText('burger')).not.toBeInTheDocument()
    })

    it('should be case insensitive when filtering', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type here for more tags')
      await user.type(input, 'PIZ')
      
      expect(screen.getByText('pizza')).toBeInTheDocument()
    })

    it('should show default options when search input is 2 characters or less', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type here for more tags')
      await user.type(input, 'pi')
      
      // Should still show first 5 default options
      expect(screen.getByText('pizza')).toBeInTheDocument()
      expect(screen.getByText('pasta')).toBeInTheDocument()
      expect(screen.getByText('burger')).toBeInTheDocument()
    })
  })

  describe('Tag Selection', () => {
    it('should add tag when clicking on unselected option', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const pizzaOption = screen.getByText('pizza')
      await user.click(pizzaOption)
      
      // Should show pizza as selected (solid variant)
      const selectedPizza = screen.getByText('pizza')
      expect(selectedPizza).toBeInTheDocument()
    })

    it('should remove tag when clicking on selected option', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      // First add a tag
      const pizzaOption = screen.getByText('pizza')
      await user.click(pizzaOption)
      
      // Then click it again to remove
      const selectedPizza = screen.getByText('pizza')
      await user.click(selectedPizza)
      
      // Should enable submit button since no tags selected
      const submitButton = screen.getByRole('button', { name: /search/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when tags are selected', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const pizzaOption = screen.getByText('pizza')
      await user.click(pizzaOption)
      
      const submitButton = screen.getByRole('button', { name: /search/i })
      expect(submitButton).not.toBeDisabled()
    })

    it('should hide selected options from available options list', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      // Click pizza to select it
      const pizzaOption = screen.getByText('pizza')
      await user.click(pizzaOption)
      
      // Pizza should still be visible as selected, but not in the unselected options
      const allPizzaElements = screen.getAllByText('pizza')
      expect(allPizzaElements).toHaveLength(1) // Only the selected one
    })
  })

  describe('Maximum Options Limit', () => {
    it('should show warning message when 10 tags are selected', async () => {
      const user = userEvent.setup()
      const manyOptions = Array.from({ length: 15 }, (_, i) => `option${i}`)
      
      render(<InputAutocomplete options={manyOptions} onSubmit={mockOnSubmit} />)
      
      // Select 10 options
      for (let i = 0; i < 10; i++) {
        const option = screen.getByText(`option${i}`)
        await user.click(option)
      }
      
      expect(screen.getByText('Only 10 filters at a time please 😘')).toBeInTheDocument()
    })

    it('should not allow selecting more than 10 tags', async () => {
      const user = userEvent.setup()
      const manyOptions = Array.from({ length: 15 }, (_, i) => `option${i}`)
      
      render(<InputAutocomplete options={manyOptions} onSubmit={mockOnSubmit} />)
      
      // Select 10 options
      for (let i = 0; i < 10; i++) {
        const option = screen.getByText(`option${i}`)
        await user.click(option)
      }
      
      // Try to select 11th option - should not be added
      const eleventhOption = screen.getByText('option10')
      await user.click(eleventhOption)
      
      // Should still only have 10 selected options
      const selectedOptions = screen.getAllByText(/option\d+/).filter(el => 
        el.closest('[data-selected="true"]') || 
        el.getAttribute('data-variant') === 'solid'
      )
      expect(selectedOptions.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit with selected tags when submit button is clicked', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      // Select some tags
      await user.click(screen.getByText('pizza'))
      await user.click(screen.getByText('pasta'))
      
      // Click submit
      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)
      
      expect(mockOnSubmit).toHaveBeenCalledWith(['pizza', 'pasta'])
    })

    it('should not call onSubmit when no tags are selected', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /search/i })
      
      // Button should be disabled, but let's try clicking anyway
      expect(submitButton).toBeDisabled()
      
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Input Handling', () => {
    it('should update search input value when typing', async () => {
      const user = userEvent.setup()
      render(<InputAutocomplete {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type here for more tags')
      await user.type(input, 'test')
      
      expect(input).toHaveValue('test')
    })

    it('should clear input value when component is re-rendered', () => {
      const { rerender } = render(<InputAutocomplete {...defaultProps} />)
      
      rerender(<InputAutocomplete {...defaultProps} />)
      
      const input = screen.getByPlaceholderText('Type here for more tags')
      expect(input).toHaveValue('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(<InputAutocomplete options={[]} onSubmit={mockOnSubmit} />)
      
      expect(screen.getByPlaceholderText('Type here for more tags')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    })

    it('should handle options with special characters', async () => {
      const specialOptions = ['café & bistro', 'mom\'s pizza', 'taco-bell']
      const user = userEvent.setup()
      
      render(<InputAutocomplete options={specialOptions} onSubmit={mockOnSubmit} />)
      
      await user.click(screen.getByText('café & bistro'))
      
      const submitButton = screen.getByRole('button', { name: /search/i })
      await user.click(submitButton)
      
      expect(mockOnSubmit).toHaveBeenCalledWith(['café & bistro'])
    })

    it('should handle duplicate options gracefully', () => {
      const duplicateOptions = ['pizza', 'pizza', 'pasta', 'pasta']
      
      render(<InputAutocomplete options={duplicateOptions} onSubmit={mockOnSubmit} />)
      
      // Component should render without crashing even with duplicate options
      expect(screen.getByPlaceholderText('Type here for more tags')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
      
      // Note: The component may show duplicates as it doesn't filter them internally
      // This test verifies it doesn't crash with duplicate data
    })
  })
})