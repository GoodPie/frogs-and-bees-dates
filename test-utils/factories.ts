import { vi } from 'vitest'
import IActivityDetails from '../src/interfaces/IActivityDetails'
import ICalendarActivity from '../src/interfaces/ICalendarActivity'
import ActivityType from '../src/enums/ActivityType'
import ActivityTime from '../src/enums/ActivityTime'

// Mock Firebase User type
export interface MockUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
}

// Activity factory
export const createMockActivity = (overrides: Partial<IActivityDetails> = {}): IActivityDetails => ({
  name: 'Test Activity',
  description: 'Test activity description',
  date: new Date('2024-01-15'),
  ...overrides,
})

// Calendar activity factory
export const createMockCalendarActivity = (overrides: Partial<ICalendarActivity> = {}): ICalendarActivity => ({
  id: 'test-activity-id',
  date: Date.now(),
  activityName: 'Test Calendar Activity',
  activityDesc: 'Test calendar activity description',
  done: false,
  onEventMarkedAsDone: vi.fn(),
  ...overrides,
})

// User factory
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  ...overrides,
})

// Auth state factory
export const createMockAuthState = (user: MockUser | null = null) => ({
  currentUser: user,
  isAuthenticated: !!user,
})

// Activity type factory helpers
export const createFoodActivity = (overrides: Partial<IActivityDetails> = {}): IActivityDetails =>
  createMockActivity({
    name: 'Restaurant Visit',
    description: 'Try the new Italian restaurant downtown',
    ...overrides,
  })

export const createMovieActivity = (overrides: Partial<IActivityDetails> = {}): IActivityDetails =>
  createMockActivity({
    name: 'Movie Night',
    description: 'Watch the latest superhero movie',
    ...overrides,
  })

export const createBigActivity = (overrides: Partial<IActivityDetails> = {}): IActivityDetails =>
  createMockActivity({
    name: 'Weekend Getaway',
    description: 'Trip to the mountains for hiking',
    ...overrides,
  })

// Calendar activity with specific dates
export const createTodayCalendarActivity = (overrides: Partial<ICalendarActivity> = {}): ICalendarActivity =>
  createMockCalendarActivity({
    date: Date.now(),
    activityName: 'Today\'s Activity',
    ...overrides,
  })

export const createFutureCalendarActivity = (daysFromNow: number = 7, overrides: Partial<ICalendarActivity> = {}): ICalendarActivity => {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysFromNow)
  
  return createMockCalendarActivity({
    date: futureDate.getTime(),
    activityName: 'Future Activity',
    ...overrides,
  })
}

// Batch factories for testing lists
export const createMockActivityList = (count: number = 3): IActivityDetails[] =>
  Array.from({ length: count }, (_, index) =>
    createMockActivity({
      name: `Activity ${index + 1}`,
      description: `Description for activity ${index + 1}`,
    })
  )

export const createMockCalendarActivityList = (count: number = 3): ICalendarActivity[] =>
  Array.from({ length: count }, (_, index) =>
    createMockCalendarActivity({
      id: `activity-${index + 1}`,
      activityName: `Calendar Activity ${index + 1}`,
      activityDesc: `Description for calendar activity ${index + 1}`,
    })
  )

// Enum value helpers for testing
export const getAllActivityTypes = (): ActivityType[] => [
  ActivityType.NONE,
  ActivityType.FOOD,
  ActivityType.ACTIVITY,
  ActivityType.MOVIE,
  ActivityType.BIG,
]

export const getAllActivityTimes = (): ActivityTime[] => [
  ActivityTime.ANYTIME,
  ActivityTime.MORNING,
  ActivityTime.AFTERNOON,
  ActivityTime.EVENING,
]

// Firebase mock data helpers
export const createMockFirestoreDoc = (data: any = {}) => ({
  id: 'mock-doc-id',
  data: () => data,
  exists: () => true,
  ...data,
})

export const createMockFirestoreCollection = (docs: any[] = []) => ({
  docs: docs.map(createMockFirestoreDoc),
  size: docs.length,
  empty: docs.length === 0,
})