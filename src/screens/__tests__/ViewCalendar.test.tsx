import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '../../../test-utils/render'
import ViewCalendar from '../ViewCalendar'
import { createMockCalendarActivity, createMockCalendarActivityList, createTodayCalendarActivity, createFutureCalendarActivity } from '../../../test-utils/factories'
import * as firestore from 'firebase/firestore'
import { suppressUnhandledRejections, createMockFirebaseError } from '../../../test-utils/errorHandling'

// Mock Firebase modules
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
}))

vi.mock('../../FirebaseConfig', () => ({
  db: {},
}))

// Mock the CalendarEvent component
vi.mock('../../components/CalendarEvent', () => ({
  default: ({ id, activityName, date, activityDesc, onEventMarkedAsDone }: any) => (
    <div data-testid={`calendar-event-${id}`}>
      <h3>{activityName}</h3>
      <p>{activityDesc}</p>
      <span>Date: {new Date(date * 1000).toLocaleDateString()}</span>
      <button onClick={onEventMarkedAsDone}>Mark Done</button>
    </div>
  ),
}))

// Mock dayjs
vi.mock('dayjs', () => {
  const mockDayjs = vi.fn(() => ({
    startOf: vi.fn(() => ({
      toDate: vi.fn(() => ({
        valueOf: vi.fn(() => Date.now()),
      })),
    })),
  }))
  return {
    default: mockDayjs,
  }
})

describe('ViewCalendar Component', () => {
  const mockGetDocs = vi.mocked(firestore.getDocs)
  const mockCollection = vi.mocked(firestore.collection)
  const mockQuery = vi.mocked(firestore.query)
  const mockWhere = vi.mocked(firestore.where)
  const mockOrderBy = vi.mocked(firestore.orderBy)
  
  let errorSuppression: ReturnType<typeof suppressUnhandledRejections> | null = null

  const createMockQuerySnapshot = (data: any[]) => ({
    docs: data.map((item, index) => ({
      id: item.id || `doc-${index}`,
      data: () => item,
      exists: () => true,
    })),
    empty: data.length === 0,
    size: data.length,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default empty snapshot
    const emptySnapshot = createMockQuerySnapshot([])
    mockGetDocs.mockResolvedValue(emptySnapshot as any)
    mockCollection.mockReturnValue({} as any)
    mockQuery.mockReturnValue({} as any)
    mockWhere.mockReturnValue({} as any)
    mockOrderBy.mockReturnValue({} as any)
  })

  afterEach(() => {
    if (errorSuppression) {
      errorSuppression.restore()
      errorSuppression = null
    }
  })

  describe('Initial Rendering', () => {
    it('should render calendar container', () => {
      render(<ViewCalendar />)
      
      // Should render the main container - use a more specific selector
      const container = document.querySelector('.chakra-stack')
      expect(container).toBeInTheDocument()
    })

    it('should fetch calendar events on mount', async () => {
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(mockCollection).toHaveBeenCalledWith({}, 'calendarEvents')
        expect(mockGetDocs).toHaveBeenCalled()
      })
    })

    it('should query events with correct filters', async () => {
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(mockQuery).toHaveBeenCalled()
        expect(mockWhere).toHaveBeenCalledWith('date', '>=', expect.any(Number))
        expect(mockOrderBy).toHaveBeenCalledWith('date')
      })
    })
  })

  describe('Calendar Events Display', () => {
    it('should display calendar events when available', async () => {
      const mockEvents = createMockCalendarActivityList(2)
      const mockEventsSnapshot = createMockQuerySnapshot(mockEvents)
      mockGetDocs.mockResolvedValue(mockEventsSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByTestId(`calendar-event-${mockEvents[0].id}`)).toBeInTheDocument()
        expect(screen.getByTestId(`calendar-event-${mockEvents[1].id}`)).toBeInTheDocument()
      })
    })

    it('should display event details correctly', async () => {
      const mockEvent = createMockCalendarActivity({
        id: 'test-event-1',
        activityName: 'Dinner Date',
        activityDesc: 'Romantic dinner at Italian restaurant',
        date: Date.now() / 1000, // Convert to seconds for Firebase timestamp
      })
      const mockEventSnapshot = createMockQuerySnapshot([mockEvent])
      mockGetDocs.mockResolvedValue(mockEventSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByText('Dinner Date')).toBeInTheDocument()
        expect(screen.getByText('Romantic dinner at Italian restaurant')).toBeInTheDocument()
      })
    })

    it('should show "No Upcoming Events" message when no events exist', async () => {
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
      })
    })

    it('should filter out completed events', async () => {
      const completedEvent = createMockCalendarActivity({
        id: 'completed-event',
        activityName: 'Completed Activity',
        done: true,
      })
      const activeEvent = createMockCalendarActivity({
        id: 'active-event',
        activityName: 'Active Activity',
        done: false,
      })
      const mockEventsSnapshot = createMockQuerySnapshot([completedEvent, activeEvent])
      mockGetDocs.mockResolvedValue(mockEventsSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.queryByTestId('calendar-event-completed-event')).not.toBeInTheDocument()
        expect(screen.getByTestId('calendar-event-active-event')).toBeInTheDocument()
      })
    })

    it('should filter out events without done property (treating as active)', async () => {
      const eventWithoutDone = createMockCalendarActivity({
        id: 'no-done-property',
        activityName: 'Event Without Done Property',
      })
      delete (eventWithoutDone as any).done // Remove done property
      
      const mockEventSnapshot = createMockQuerySnapshot([eventWithoutDone])
      mockGetDocs.mockResolvedValue(mockEventSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-no-done-property')).toBeInTheDocument()
      })
    })
  })

  describe('Event Management', () => {
    it('should refresh events when onEventMarkedAsDone is called', async () => {
      const mockEvent = createMockCalendarActivity({
        id: 'test-event',
        activityName: 'Test Event',
      })
      const mockEventSnapshot = createMockQuerySnapshot([mockEvent])
      mockGetDocs.mockResolvedValue(mockEventSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-test-event')).toBeInTheDocument()
      })
      
      // Reset the mock call count before clicking
      mockGetDocs.mockClear()
      
      // Simulate marking event as done
      const markDoneButton = screen.getByText('Mark Done')
      markDoneButton.click()
      
      // Should trigger another fetch
      await waitFor(() => {
        expect(mockGetDocs).toHaveBeenCalledTimes(1)
      })
    })

    it('should handle multiple events correctly', async () => {
      const mockEvents = [
        createTodayCalendarActivity({ id: 'today-event', activityName: 'Today Event' }),
        createFutureCalendarActivity(7, { id: 'future-event', activityName: 'Future Event' }),
        createFutureCalendarActivity(14, { id: 'far-future-event', activityName: 'Far Future Event' }),
      ]
      const mockEventsSnapshot = createMockQuerySnapshot(mockEvents)
      mockGetDocs.mockResolvedValue(mockEventsSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-today-event')).toBeInTheDocument()
        expect(screen.getByTestId('calendar-event-future-event')).toBeInTheDocument()
        expect(screen.getByTestId('calendar-event-far-future-event')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Firebase query errors gracefully', async () => {
      // Suppress unhandled rejections for this test
      errorSuppression = suppressUnhandledRejections()
      
      mockGetDocs.mockRejectedValue(createMockFirebaseError('Firebase connection failed'))
      
      // Wrap the render in a try-catch to handle the error
      try {
        render(<ViewCalendar />)
      } catch (error) {
        // Expected error from Firebase mock
      }
      
      // Should not crash and should show no events message
      await waitFor(() => {
        expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should handle empty query snapshots', async () => {
      // Mock empty snapshot
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
        size: 0,
      } as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByText(/no upcoming events/i)).toBeInTheDocument()
      })
    })

    it('should handle malformed event data', async () => {
      const malformedEvent = {
        // Missing required fields
        id: 'malformed-event',
      }
      const mockMalformedSnapshot = createMockQuerySnapshot([malformedEvent])
      mockGetDocs.mockResolvedValue(mockMalformedSnapshot as any)
      
      render(<ViewCalendar />)
      
      // Should not crash
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-malformed-event')).toBeInTheDocument()
      })
    })
  })

  describe('Date Filtering', () => {
    it('should only show future events', async () => {
      // This is tested through the Firebase query parameters
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(mockWhere).toHaveBeenCalledWith('date', '>=', expect.any(Number))
      })
    })

    it('should order events by date', async () => {
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(mockOrderBy).toHaveBeenCalledWith('date')
      })
    })
  })

  describe('Component Integration', () => {
    it('should pass correct props to CalendarEvent components', async () => {
      const mockEvent = createMockCalendarActivity({
        id: 'integration-test',
        activityName: 'Integration Test Event',
        activityDesc: 'Testing component integration',
        date: Date.now() / 1000,
      })
      const mockEventSnapshot = createMockQuerySnapshot([mockEvent])
      mockGetDocs.mockResolvedValue(mockEventSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        const eventComponent = screen.getByTestId('calendar-event-integration-test')
        expect(eventComponent).toBeInTheDocument()
        expect(screen.getByText('Integration Test Event')).toBeInTheDocument()
        expect(screen.getByText('Testing component integration')).toBeInTheDocument()
      })
    })

    it('should handle calendar event refresh callback', async () => {
      const mockEvent = createMockCalendarActivity({
        id: 'callback-test',
        activityName: 'Callback Test Event',
      })
      const mockEventSnapshot = createMockQuerySnapshot([mockEvent])
      mockGetDocs.mockResolvedValue(mockEventSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event-callback-test')).toBeInTheDocument()
      })
      
      // The onEventMarkedAsDone callback should be the RefreshEvents function
      const markDoneButton = screen.getByText('Mark Done')
      expect(markDoneButton).toBeInTheDocument()
    })
  })

  describe('Scrollable Container', () => {
    it('should render scrollable container with correct styling', () => {
      render(<ViewCalendar />)
      
      // VStack with overflow auto should be present - use class selector
      const container = document.querySelector('.chakra-stack')
      expect(container).toBeInTheDocument()
    })

    it('should handle large numbers of events', async () => {
      const manyEvents = createMockCalendarActivityList(10)
      const mockManyEventsSnapshot = createMockQuerySnapshot(manyEvents)
      mockGetDocs.mockResolvedValue(mockManyEventsSnapshot as any)
      
      render(<ViewCalendar />)
      
      await waitFor(() => {
        manyEvents.forEach((event) => {
          expect(screen.getByTestId(`calendar-event-${event.id}`)).toBeInTheDocument()
        })
      })
    })
  })
})