import { JSDOM } from "jsdom"
import ResizeObserver from "resize-observer-polyfill"
import { vi, beforeEach } from "vitest"
import { firebaseMocks, resetFirebaseMocks } from "./src/__mocks__/firebase"

const { window } = new JSDOM()

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
