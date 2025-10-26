import * as jsdom from "jsdom"
import ResizeObserver from "resize-observer-polyfill"
import { vi, beforeEach, expect } from "vitest"
import { firebaseMocks, resetFirebaseMocks } from "@/__mocks__/firebase"
import * as matchers from '@testing-library/jest-dom/matchers'

const { JSDOM } = jsdom;

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Global error handling for tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Suppress specific warnings and errors that are expected in tests
console.error = (...args: string[]) => {
  const message = args[0]?.toString() || ''
  
  // Suppress React warnings that are expected in tests
  if (
    message.includes('Warning: An update to') ||
    message.includes('Warning: Each child in a list should have a unique "key" prop') ||
    message.includes('Firebase error') ||
    message.includes('act(...)')
  ) {
    return
  }
  
  originalConsoleError(...args)
}

console.warn = (...args: string[]) => {
  const message = args[0]?.toString() || ''
  
  // Suppress specific warnings
  if (message.includes('No license field')) {
    return
  }
  
  originalConsoleWarn(...args)
}

// Handle unhandled promise rejections in tests globally
process.on('unhandledRejection', (reason: string | Error) => {
  // Only log unexpected rejections
  if (reason instanceof Error && (
    reason.message.includes('Firebase') || 
    reason.name === 'FirebaseError' ||
    reason.message.includes('Firebase connection failed')
  )) {
    // Expected test error, ignore it
    return
  }
  originalConsoleError('Unexpected unhandled rejection:', reason)
})

const {window} = new JSDOM().window

// ResizeObserver mock
vi.stubGlobal("ResizeObserver", ResizeObserver)
window["ResizeObserver"] = ResizeObserver

// IntersectionObserver mock
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}))
vi.stubGlobal("IntersectionObserver", IntersectionObserverMock)
window["IntersectionObserver"] = IntersectionObserverMock

// Scroll Methods mock
window.Element.prototype.scrollTo = () => { }
window.Element.prototype.scrollIntoView = () => { }

// requestAnimationFrame mock
window.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 1000 / 60)

// matchMedia mock (used by some UI libs / Chakra / media queries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    dispatchEvent: vi.fn(),
  })),
});

// URL object mock
window.URL.createObjectURL = () => "https://i.pravatar.cc/300"
window.URL.revokeObjectURL = () => { }

// localStorage mock to avoid SecurityError in tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// navigator mock
Object.defineProperty(window, "navigator", {
  value: {
    clipboard: {
      writeText: vi.fn(),
    },
  },
})

// Firebase v9 modular SDK mocks
vi.mock('firebase/app', () => ({
  initializeApp: firebaseMocks.initializeApp,
  getApps: firebaseMocks.getApps,
  getApp: firebaseMocks.getApp,
}));

vi.mock('firebase/auth', () => ({
  getAuth: firebaseMocks.getAuth,
  signInWithPopup: firebaseMocks.signInWithPopup,
  onAuthStateChanged: firebaseMocks.onAuthStateChanged,
  GoogleAuthProvider: vi.fn(() => firebaseMocks.googleAuthProvider),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: firebaseMocks.getFirestore,
  doc: firebaseMocks.doc,
  setDoc: firebaseMocks.setDoc,
  getDoc: firebaseMocks.getDoc,
  addDoc: firebaseMocks.addDoc,
  updateDoc: firebaseMocks.updateDoc,
  deleteDoc: firebaseMocks.deleteDoc,
  collection: firebaseMocks.collection,
  getDocs: firebaseMocks.getDocs,
  query: firebaseMocks.query,
  where: firebaseMocks.where,
  orderBy: firebaseMocks.orderBy,
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: firebaseMocks.getAnalytics,
  logEvent: firebaseMocks.logEvent,
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: firebaseMocks.getMessaging,
  getToken: firebaseMocks.getToken,
}));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    permission: 'granted',
  },
});

// React Router mocks for navigation and location hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/', state: {} })),
  };
});

// Expose Firebase mocks globally for test assertions
Object.assign(global, {
  window,
  document: window.document,
  __firebaseMocks: firebaseMocks,
});

// Reset Firebase mocks before each test
beforeEach(() => {
  resetFirebaseMocks();
});
