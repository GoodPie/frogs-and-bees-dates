import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, userEvent, waitFor } from '../../../test-utils/render'
import ActivitySelection from '../ActivitySelection'
import { createMockActivity, createMockActivityList } from '../../../test-utils/factories'
import ActivityType from '../../enums/ActivityType'
import * as firestore from 'firebase/firestore'
import { suppressUnhandledRejections, createMockFirebaseError } from '../../../test-utils/errorHandling'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    deleteDoc: vi.fn(),
}))

vi.mock('../../FirebaseConfig', () => ({
    db: {},
}))

// Mock the AddNewActivity and AddToCalendar components
vi.mock('../../components/AddNewActivity', () => ({
    default: ({ onAdded, availableActivities }: any) => (
        <div data-testid="add-new-activity">
            Add New Activity Mock - Tags: {availableActivities?.length || 0}
        </div>
    ),
}))

vi.mock('../../components/AddToCalendar', () => ({
    default: ({ activityName, activityDescription }: any) => (
        <button data-testid="add-to-calendar">
            Add to Calendar: {activityName}
        </button>
    ),
}))

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
    writable: true,
    value: vi.fn(),
})

describe('ActivitySelection Component', () => {
    const mockGetDocs = vi.mocked(firestore.getDocs)
    const mockCollection = vi.mocked(firestore.collection)
    const mockQuery = vi.mocked(firestore.query)
    const mockWhere = vi.mocked(firestore.where)
    const mockOrderBy = vi.mocked(firestore.orderBy)
    const mockDeleteDoc = vi.mocked(firestore.deleteDoc)
    
    let errorSuppression: ReturnType<typeof suppressUnhandledRejections> | null = null

    const createMockQuerySnapshot = (data: any[]) => ({
        docs: data.map((item, index) => ({
            id: `doc-${index}`,
            data: () => item,
            exists: () => true,
            ref: { id: `doc-${index}` },
        })),
        empty: data.length === 0,
        size: data.length,
        forEach: vi.fn((callback) => {
            data.forEach((item, index) => {
                callback({
                    id: `doc-${index}`,
                    data: () => item,
                    exists: () => true,
                })
            })
        }),
    })

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock tags collection by default
        const mockTagsSnapshot = createMockQuerySnapshot(['tag1', 'tag2', 'tag3'])
        mockGetDocs.mockResolvedValue(mockTagsSnapshot as any)
        mockCollection.mockReturnValue({} as any)
        mockQuery.mockReturnValue({} as any)
        mockWhere.mockReturnValue({} as any)
        mockOrderBy.mockReturnValue({} as any)
        mockDeleteDoc.mockResolvedValue(undefined as any)
    })

    afterEach(() => {
        if (errorSuppression) {
            errorSuppression.restore()
            errorSuppression = null
        }
    })

    describe('Initial Rendering', () => {
        it('should render activity type selection buttons initially', () => {
            render(<ActivitySelection />)

            expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /movie/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /bougie ballers/i })).toBeInTheDocument()
        })

        it('should render AddNewActivity component', () => {
            render(<ActivitySelection />)

            expect(screen.getByTestId('add-new-activity')).toBeInTheDocument()
        })

        it('should load available tags on mount', async () => {
            render(<ActivitySelection />)

            await waitFor(() => {
                expect(mockGetDocs).toHaveBeenCalled()
            })
        })
    })

    describe('Activity Type Selection', () => {
        it('should handle food activity type selection', async () => {
            const user = userEvent.setup()
            const mockActivities = createMockActivityList(2)
            const mockActivitiesSnapshot = createMockQuerySnapshot(mockActivities)
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(mockQuery).toHaveBeenCalled()
                expect(mockWhere).toHaveBeenCalledWith('type', '==', ActivityType.FOOD)
            })
        })

        it('should handle activity type selection', async () => {
            const user = userEvent.setup()
            const mockActivities = createMockActivityList(2)
            const mockActivitiesSnapshot = createMockQuerySnapshot(mockActivities)
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const activityButton = screen.getByRole('button', { name: /^activity$/i })
            await user.click(activityButton)

            await waitFor(() => {
                expect(mockWhere).toHaveBeenCalledWith('type', '==', ActivityType.ACTIVITY)
            })
        })

        it('should handle movie type selection', async () => {
            const user = userEvent.setup()
            const mockActivities = createMockActivityList(2)
            const mockActivitiesSnapshot = createMockQuerySnapshot(mockActivities)
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const movieButton = screen.getByRole('button', { name: /movie/i })
            await user.click(movieButton)

            await waitFor(() => {
                expect(mockWhere).toHaveBeenCalledWith('type', '==', ActivityType.MOVIE)
            })
        })

        it('should handle big activity type selection', async () => {
            const user = userEvent.setup()
            const mockActivities = createMockActivityList(2)
            const mockActivitiesSnapshot = createMockQuerySnapshot(mockActivities)
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const bigButton = screen.getByRole('button', { name: /bougie ballers/i })
            await user.click(bigButton)

            await waitFor(() => {
                expect(mockWhere).toHaveBeenCalledWith('type', '==', ActivityType.BIG)
            })
        })
    })

    describe('Activity Display', () => {
        it('should show activity step progression when button is clicked', async () => {
            const user = userEvent.setup()

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            // After clicking, we should see the activity management buttons (indicating step progression)
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
            })
        })

        it('should display selected activity details', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({
                name: 'Test Restaurant',
                description: 'Great Italian food',
            })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
                expect(screen.getByText('Great Italian food')).toBeInTheDocument()
            })
        })

        it('should show "No Activities Found" when no activities match filters', async () => {
            const user = userEvent.setup()
            const emptySnapshot = createMockQuerySnapshot([])
            mockGetDocs.mockResolvedValue(emptySnapshot as any)

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText(/no activities found/i)).toBeInTheDocument()
                expect(screen.getByText(/try using different filters/i)).toBeInTheDocument()
            })
        })
    })

    describe('Activity Management', () => {
        it('should show activity management buttons when activity is selected', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({ name: 'Test Activity' })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
                expect(screen.getByTestId('add-to-calendar')).toBeInTheDocument()
                expect(screen.getByRole('button', { name: /return home/i })).toBeInTheDocument()
            })
        })

        it('should handle activity removal with confirmation', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({ name: 'Test Activity' })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)
            vi.mocked(window.confirm).mockReturnValue(true)

            render(<ActivitySelection />)

            // Select activity first
            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText('Test Activity')).toBeInTheDocument()
            })

            // Remove activity
            const removeButton = screen.getByRole('button', { name: /remove/i })
            await user.click(removeButton)

            expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to remove: Test Activity')
            expect(mockDeleteDoc).toHaveBeenCalled()
        })

        it('should not remove activity if user cancels confirmation', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({ name: 'Test Activity' })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)
            vi.mocked(window.confirm).mockReturnValue(false)

            render(<ActivitySelection />)

            // Select activity first
            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText('Test Activity')).toBeInTheDocument()
            })

            // Try to remove activity
            const removeButton = screen.getByRole('button', { name: /remove/i })
            await user.click(removeButton)

            expect(window.confirm).toHaveBeenCalled()
            expect(mockDeleteDoc).not.toHaveBeenCalled()
        })

        it('should show refresh button when activity is selected', async () => {
            const user = userEvent.setup()
            const mockActivities = createMockActivityList(3)
            const mockActivitiesSnapshot = createMockQuerySnapshot(mockActivities)
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            // Select activity first
            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /Activity \d/ })).toBeInTheDocument()
            })

            // Should show refresh button (button with SVG icon)
            const refreshButtons = screen.getAllByRole('button')
            const refreshButton = refreshButtons.find(button =>
                button.querySelector('svg') && !button.textContent?.includes('Remove') && !button.textContent?.includes('Return')
            )

            expect(refreshButton).toBeInTheDocument()
        })

        it('should reset to home when return home button is clicked', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({ name: 'Test Activity' })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            // Select activity first
            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText('Test Activity')).toBeInTheDocument()
            })

            // Return home
            const returnHomeButton = screen.getByRole('button', { name: /return home/i })
            await user.click(returnHomeButton)

            // Should show activity type buttons again
            expect(screen.getByRole('button', { name: /food/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        it('should handle Firebase errors gracefully', async () => {
            // Suppress unhandled rejections for this test
            errorSuppression = suppressUnhandledRejections()
            
            const user = userEvent.setup()

            // First call succeeds for tags, second call fails for activities
            mockGetDocs
                .mockResolvedValueOnce(createMockQuerySnapshot(['tag1', 'tag2']) as any)
                .mockRejectedValueOnce(createMockFirebaseError('Firebase connection failed'))

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            
            // Use a try-catch to handle the click that will trigger the error
            try {
                await user.click(foodButton)
            } catch (error) {
                // Expected error from Firebase mock
            }

            // Should not crash - we can verify the component still renders
            await waitFor(() => {
                // Component should still be functional - check for basic elements
                expect(screen.getByTestId('add-new-activity')).toBeInTheDocument()
            }, { timeout: 3000 })
        })
    })

    describe('Integration with Child Components', () => {
        it('should pass available tags to AddNewActivity component', async () => {
            const mockTags = ['tag1', 'tag2', 'tag3']
            const mockTagsSnapshot = createMockQuerySnapshot(mockTags)
            mockGetDocs.mockResolvedValue(mockTagsSnapshot as any)

            render(<ActivitySelection />)

            await waitFor(() => {
                expect(screen.getByText(/tags: 3/i)).toBeInTheDocument()
            })
        })

        it('should pass activity details to AddToCalendar component', async () => {
            const user = userEvent.setup()
            const mockActivity = createMockActivity({ name: 'Test Activity' })
            const mockActivitiesSnapshot = createMockQuerySnapshot([mockActivity])
            mockGetDocs.mockResolvedValue(mockActivitiesSnapshot as any)

            render(<ActivitySelection />)

            const foodButton = screen.getByRole('button', { name: /food/i })
            await user.click(foodButton)

            await waitFor(() => {
                expect(screen.getByText(/add to calendar: test activity/i)).toBeInTheDocument()
            })
        })
    })
})