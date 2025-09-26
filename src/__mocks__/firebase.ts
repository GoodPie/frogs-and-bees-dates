import { vi } from 'vitest';

// Mock user object for authentication
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
};

// Mock Firebase Auth
export const mockAuth = {
  currentUser: null as any,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
};

// Mock Firebase Firestore
export const mockDb = {};

// Mock Google Auth Provider
export const mockGoogleAuthProvider = {
  setCustomParameters: vi.fn(),
};

// Mock Firebase App
export const mockApp = {};

// Mock Firebase Analytics
export const mockAnalytics = {};

// Mock Firebase Messaging
export const mockMessaging = {};

// Mock document reference
export const mockDocRef = {
  id: 'mock-doc-id',
  path: 'mock/path',
};

// Mock collection reference
export const mockCollectionRef = {
  id: 'mock-collection-id',
  path: 'mock-collection',
};

// Mock query snapshot
export const mockQuerySnapshot = {
  docs: [],
  empty: true,
  size: 0,
  forEach: vi.fn(),
};

// Global Firebase mocks object for test assertions
export const firebaseMocks = {
  auth: mockAuth,
  db: mockDb,
  googleAuthProvider: mockGoogleAuthProvider,
  app: mockApp,
  analytics: mockAnalytics,
  messaging: mockMessaging,
  user: mockUser,
  docRef: mockDocRef,
  collectionRef: mockCollectionRef,
  querySnapshot: mockQuerySnapshot,
  
  // Auth functions
  signInWithPopup: vi.fn().mockResolvedValue({ user: mockUser }),
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(() => mockAuth),
  
  // Firestore functions
  doc: vi.fn(() => mockDocRef),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({}) }),
  addDoc: vi.fn().mockResolvedValue(mockDocRef),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  collection: vi.fn(() => mockCollectionRef),
  getDocs: vi.fn().mockResolvedValue(mockQuerySnapshot),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getFirestore: vi.fn(() => mockDb),
  
  // App functions
  initializeApp: vi.fn(() => mockApp),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => mockApp),
  
  // Analytics functions
  getAnalytics: vi.fn(() => mockAnalytics),
  logEvent: vi.fn(),
  
  // Messaging functions
  getMessaging: vi.fn(() => mockMessaging),
  getToken: vi.fn().mockResolvedValue('mock-token'),
};

// Helper functions for test setup
export const setMockUser = (user: any = mockUser) => {
  mockAuth.currentUser = user;
};

export const clearMockUser = () => {
  mockAuth.currentUser = null;
};

export const mockAuthStateChange = (user: any = mockUser) => {
  const callback = mockAuth.onAuthStateChanged.mock.calls[0]?.[0];
  if (callback) {
    callback(user);
  }
};

export const mockFirestoreData = (data: any[]) => {
  mockQuerySnapshot.docs = data.map((item, index) => ({
    id: `doc-${index}`,
    data: () => item,
    exists: () => true,
  }));
  mockQuerySnapshot.empty = data.length === 0;
  mockQuerySnapshot.size = data.length;
};

// Reset all mocks function
export const resetFirebaseMocks = () => {
  // Reset all mock functions
  Object.values(firebaseMocks).forEach(mock => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  
  // Reset auth state
  mockAuth.currentUser = null;
  
  // Reset query snapshot
  mockQuerySnapshot.docs = [];
  mockQuerySnapshot.empty = true;
  mockQuerySnapshot.size = 0;
  
  // Restore default mock implementations
  firebaseMocks.signInWithPopup.mockResolvedValue({ user: mockUser });
  firebaseMocks.setDoc.mockResolvedValue(undefined);
  firebaseMocks.getDoc.mockResolvedValue({ exists: () => true, data: () => ({}) });
  firebaseMocks.addDoc.mockResolvedValue(mockDocRef);
  firebaseMocks.updateDoc.mockResolvedValue(undefined);
  firebaseMocks.deleteDoc.mockResolvedValue(undefined);
  firebaseMocks.getDocs.mockResolvedValue(mockQuerySnapshot);
  firebaseMocks.getToken.mockResolvedValue('mock-token');
  firebaseMocks.doc.mockReturnValue(mockDocRef);
  firebaseMocks.collection.mockReturnValue(mockCollectionRef);
  firebaseMocks.query.mockReturnValue({});
  firebaseMocks.where.mockReturnValue({});
  firebaseMocks.orderBy.mockReturnValue({});
  firebaseMocks.getAuth.mockReturnValue(mockAuth);
  firebaseMocks.getFirestore.mockReturnValue(mockDb);
  firebaseMocks.initializeApp.mockReturnValue(mockApp);
  firebaseMocks.getApps.mockReturnValue([]);
  firebaseMocks.getApp.mockReturnValue(mockApp);
  firebaseMocks.getAnalytics.mockReturnValue(mockAnalytics);
  firebaseMocks.getMessaging.mockReturnValue(mockMessaging);
};