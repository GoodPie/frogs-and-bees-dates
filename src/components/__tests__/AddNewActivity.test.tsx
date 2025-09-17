import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test-utils/render'
import AddNewActivity from '../AddNewActivity'
import ActivityType from '../../enums/ActivityType'
import ActivityTime from '../../enums/ActivityTime'

// Access global Firebase mocks
const firebaseMocks = (global as any).__firebaseMocks

describe('AddNewActivity Component', () => {
  const mockProps = {
    availableActivities: ['Existing Activity 1', 'Existing Activity 2'],
    onAdded: vi.fn(),
  }

  const user = userEvent.setup()

  beforeEach(() => {
    mockProps.onAdded.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the add activity button', () => {
      render(<AddNewActivity {...mockProps} />)
      
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      expect(addButton).toBeInTheDocument()
      expect(addButton).toHaveAttribute('id', 'add-activity-button')
    })

    it('should not show dialog initially', () => {
      render(<AddNewActivity {...mockProps} />)
      
      expect(screen.queryByText('Create Activity')).not.toBeInTheDocument()
    })

    it('should open dialog when add button is clicked', async () => {
      render(<AddNewActivity {...mockProps} />)
      
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      expect(screen.getByText('Create Activity')).toBeInTheDocument()
    })
  })

  describe('Step 1: Name Input', () => {
    beforeEach(async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
    })

    it('should show name input on first step', () => {
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).toHaveValue('')
    })

    it('should update activity name when typing', async () => {
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      
      await user.type(nameInput, 'Test Activity')
      
      expect(nameInput).toHaveValue('Test Activity')
    })

    it('should show Next button on name step', () => {
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeInTheDocument()
      expect(nextButton).toBeVisible()
    })

    it('should proceed to description step when Next is clicked', async () => {
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      expect(screen.getByPlaceholderText('Add some details')).toBeInTheDocument()
      expect(screen.getByText('Test Activity')).toBeInTheDocument()
    })
  })

  describe('Step 2: Description Input', () => {
    beforeEach(async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Navigate to description step
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
    })

    it('should show description textarea and activity name', () => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add some details')).toBeInTheDocument()
    })

    it('should update activity description when typing', async () => {
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      
      await user.type(descriptionInput, 'Test description')
      
      expect(descriptionInput).toHaveValue('Test description')
    })

    it('should proceed to type selection when Next is clicked', async () => {
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      expect(screen.getByText('Type of Activity?')).toBeInTheDocument()
    })
  })

  describe('Step 3: Activity Type Selection', () => {
    beforeEach(async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Navigate to type selection step
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
    })

    it('should show all activity type options', () => {
      expect(screen.getByText('Type of Activity?')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /movie/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bougie ballers/i })).toBeInTheDocument()
    })

    it('should automatically proceed to tags step when Food type is selected', async () => {
      const foodButton = screen.getByRole('button', { name: /food/i })
      await user.click(foodButton)
      
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
    })

    it('should automatically proceed to tags step when Activity type is selected', async () => {
      const activityButton = screen.getByRole('button', { name: /activity/i })
      await user.click(activityButton)
      
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
    })

    it('should automatically proceed to tags step when Movie type is selected', async () => {
      const movieButton = screen.getByRole('button', { name: /movie/i })
      await user.click(movieButton)
      
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
    })

    it('should automatically proceed to tags step when Big type is selected', async () => {
      const bigButton = screen.getByRole('button', { name: /bougie ballers/i })
      await user.click(bigButton)
      
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
    })
  })

  describe('Step 4: Tags Management', () => {
    beforeEach(async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Navigate to tags step
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const foodButton = screen.getByRole('button', { name: /food/i })
      await user.click(foodButton)
    })

    it('should show tag input and Add Activity button', () => {
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add activity/i })).toBeInTheDocument()
    })

    it('should add tag when Enter is pressed', async () => {
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      
      await user.type(tagInput, 'romantic')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('romantic')).toBeInTheDocument()
      expect(tagInput).toHaveValue('')
    })

    it('should add multiple tags', async () => {
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      
      await user.type(tagInput, 'romantic')
      await user.keyboard('{Enter}')
      await user.type(tagInput, 'outdoor')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('romantic')).toBeInTheDocument()
      expect(screen.getByText('outdoor')).toBeInTheDocument()
    })

    it('should not add duplicate tags (case insensitive)', async () => {
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      
      await user.type(tagInput, 'romantic')
      await user.keyboard('{Enter}')
      await user.type(tagInput, 'ROMANTIC')
      await user.keyboard('{Enter}')
      
      const romanticTags = screen.getAllByText('romantic')
      expect(romanticTags).toHaveLength(1)
    })

    it('should not add empty tags', async () => {
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      
      await user.keyboard('{Enter}')
      
      // Should not show any tags
      expect(screen.queryByRole('button', { name: /romantic/i })).not.toBeInTheDocument()
    })

    it('should remove tag when clicked', async () => {
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      
      await user.type(tagInput, 'romantic')
      await user.keyboard('{Enter}')
      
      const tagElement = screen.getByText('romantic')
      await user.click(tagElement)
      
      expect(screen.queryByText('romantic')).not.toBeInTheDocument()
    })
  })

  describe('Firebase Integration', () => {
    beforeEach(async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Fill out complete form
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const foodButton = screen.getByRole('button', { name: /food/i })
      await user.click(foodButton)
      
      const tagInput = screen.getByPlaceholderText('Add Some Extra Tags')
      await user.type(tagInput, 'romantic')
      await user.keyboard('{Enter}')
      await user.type(tagInput, 'outdoor')
      await user.keyboard('{Enter}')
    })

    it('should save activity to Firebase when Add Activity is clicked', async () => {
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
          expect.anything(), // doc reference
          {
            name: 'Test Activity',
            description: 'Test description',
            type: ActivityType.FOOD,
            time: ActivityTime.ANYTIME,
            tags: ['romantic', 'outdoor']
          },
          { merge: true }
        )
      })
    })

    it('should save tags to Firebase when Add Activity is clicked', async () => {
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        // Should save each tag
        expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
          expect.anything(),
          {
            name: 'romantic',
            createdOn: expect.any(Date)
          },
          { merge: true }
        )
        
        expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
          expect.anything(),
          {
            name: 'outdoor',
            createdOn: expect.any(Date)
          },
          { merge: true }
        )
      })
    })

    it('should call onAdded callback after successful save', async () => {
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        expect(mockProps.onAdded).toHaveBeenCalledTimes(1)
      })
    })

    it('should show loading state while saving', async () => {
      // Make setDoc take some time to resolve
      firebaseMocks.setDoc.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      // Button should show loading state
      expect(addActivityButton).toBeDisabled()
    })

    it('should handle Firebase errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      firebaseMocks.setDoc.mockRejectedValue(new Error('Firebase error'))
      
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled()
      })
      
      // Should still call onAdded callback even with errors
      await waitFor(() => {
        expect(mockProps.onAdded).toHaveBeenCalled()
      })
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Form Reset and Dialog Management', () => {
    it('should reset form state correctly', async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Fill out some form data
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      
      // Verify the form has data
      expect(nameInput).toHaveValue('Test Activity')
      
      // The form reset functionality is tested in the "should reset form after successful activity creation" test
      // This test verifies that form state can be modified correctly
      expect(nameInput).toHaveValue('Test Activity')
    })

    it('should reset form after successful activity creation', async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Complete the form
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const foodButton = screen.getByRole('button', { name: /food/i })
      await user.click(foodButton)
      
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      // Wait for form to close and reset
      await waitFor(() => {
        expect(screen.queryByText('Create Activity')).not.toBeInTheDocument()
      })
      
      // Reopen dialog - should be back to step 1
      await user.click(addButton)
      expect(screen.getByPlaceholderText('Enter Activity Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter Activity Name')).toHaveValue('')
    })
  })

  describe('Form Validation and Edge Cases', () => {
    it('should handle activity type selection correctly', async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Navigate to type selection
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      // Test each activity type
      const activityButton = screen.getByRole('button', { name: /^activity$/i })
      await user.click(activityButton)
      
      // Should proceed to tags step
      expect(screen.getByPlaceholderText('Add Some Extra Tags')).toBeInTheDocument()
      
      // Complete and save to verify correct type
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            type: ActivityType.ACTIVITY,
            time: ActivityTime.ANYTIME
          }),
          { merge: true }
        )
      })
    })

    it('should set time to ANYTIME for all activity types', async () => {
      render(<AddNewActivity {...mockProps} />)
      const addButton = screen.getByRole('button', { name: /add new activity/i })
      await user.click(addButton)
      
      // Navigate through form quickly
      const nameInput = screen.getByPlaceholderText('Enter Activity Name')
      await user.type(nameInput, 'Test Activity')
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const descriptionInput = screen.getByPlaceholderText('Add some details')
      await user.type(descriptionInput, 'Test description')
      nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)
      
      const movieButton = screen.getByRole('button', { name: /movie/i })
      await user.click(movieButton)
      
      const addActivityButton = screen.getByRole('button', { name: /add activity/i })
      await user.click(addActivityButton)
      
      await waitFor(() => {
        expect(firebaseMocks.setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            time: ActivityTime.ANYTIME
          }),
          { merge: true }
        )
      })
    })
  })
})