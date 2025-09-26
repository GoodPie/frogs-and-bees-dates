import {expect, MockedFunction, vi} from "vitest"

// Re-export all test utilities for easy importing
export * from './render'
export * from './factories'

// Common test setup utilities
export const setupTest = () => {
  // Clear all mocks before each test
  vi.clearAllMocks()
}

export const cleanupTest = () => {
  // Cleanup after each test
  vi.restoreAllMocks()
}

// Common assertions helpers
export const expectElementToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectElementNotToBeInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

// Async test helpers
export const waitForElement = async (getElement: () => HTMLElement | null, timeout = 1000) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const element = getElement()
    if (element) return element
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  
  throw new Error(`Element not found within ${timeout}ms`)
}

// Mock function helpers
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
): MockedFunction<T> => {
  return vi.fn(implementation) as MockedFunction<T>
}