import { vi } from 'vitest';

// Mock Firebase Auth objects
const mockUser = { uid: 'test-user-123', email: 'test@example.com' };

const mockAuth = {
  currentUser: mockUser,
  app: {},
};

// Mock Firestore objects
const mockFirestore = {};

// Firebase v9 modular SDK mocks
export const firebaseMocks = {
  // Firebase App
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),

  // Firebase Auth
  getAuth: vi.fn(() => mockAuth),
  signInWithPopup: vi.fn(() => Promise.resolve({ user: mockUser })),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(mockAuth.currentUser);
    return vi.fn(); // Unsubscribe function
  }),
  googleAuthProvider: {
    setCustomParameters: vi.fn(),
  },

  // Firestore
  getFirestore: vi.fn(() => mockFirestore),
  doc: vi.fn((...args) => ({ id: args[args.length - 1] })),
  setDoc: vi.fn(() => Promise.resolve()),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({}) })),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ docs: [], forEach: vi.fn() })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),

  // Analytics
  getAnalytics: vi.fn(() => ({})),
  logEvent: vi.fn(),

  // Messaging
  getMessaging: vi.fn(() => ({})),
  getToken: vi.fn(() => Promise.resolve('mock-fcm-token')),
};

// Reset all mocks to initial state
export const resetFirebaseMocks = () => {
  mockAuth.currentUser = mockUser;

  Object.values(firebaseMocks).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      (mock as any).mockClear();
    }
  });
};
