import {type Mock, vi} from 'vitest';
import type {Auth, User, Unsubscribe, IdTokenResult} from 'firebase/auth';
import {addDays} from "date-fns";

// Mock Firebase Auth objects
export const mockUser: User = {
    displayName: "Test",
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    toJSON(): object {
        return structuredClone(this)
    },
    delete(): Promise<void> {
        return Promise.resolve();
    },
    getIdToken(forceRefresh?: boolean): Promise<string> {
        console.debug("getIdTokenResult", forceRefresh)
        return Promise.resolve("1");
    },
    getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult> {
        console.debug("getIdTokenResult", forceRefresh)
        return Promise.resolve({
            token: "1",
            expirationTime: addDays(Date.now(), 1).toString(),
            authTime: Date.now().toString(),
            issuedAtTime: Date.now().toString(),
            signInProvider: "google",
            claims: {},
            signInSecondFactor: null
        });
    },
    phoneNumber: "",
    photoURL: "",
    providerData: [],
    providerId: "",
    refreshToken: "",
    tenantId: "0",
    uid: 'test-user-123',
    reload(): Promise<void> {
        return Promise.resolve();
    },
    email: 'test@example.com'
};

// Store current auth state for mocking
let currentMockUser: User | null = mockUser;

const mockAuth = {
    get currentUser() {
        return currentMockUser;
    },
    set currentUser(user: User | null) {
        currentMockUser = user;
    },
    app: {},
};

// Mock Firestore objects
const mockFirestore = {};

// Store auth state change callbacks for testing
let authStateCallbacks: Array<(user: User | null) => void> = [];

// Helper to control mock auth state in tests
export const setMockAuthUser = (user: User | null) => {
    currentMockUser = user;
    // Trigger all registered callbacks
    for (const callback of authStateCallbacks) {
        callback(user);
    }
};

export const firebaseMocks = {
    // Firebase App
    initializeApp: vi.fn(() => ({})),
    getApps: vi.fn(() => []),
    getApp: vi.fn(() => ({})),

    // Firebase Auth
    getAuth: vi.fn(() => mockAuth),
    signInWithPopup: vi.fn(() => Promise.resolve({user: mockUser})),
    onAuthStateChanged: vi.fn((_auth: Auth, callback: (user: User | null) => void): Unsubscribe => {
        // Register callback for later triggering
        authStateCallbacks.push(callback);
        // Immediately call with current state
        callback(currentMockUser);
        return vi.fn(() => {
            // Remove callback on unsubscribe
            authStateCallbacks = authStateCallbacks.filter(cb => cb !== callback);
        });
    }),
    googleAuthProvider: {
        setCustomParameters: vi.fn(),
    },

    // Firestore
    getFirestore: vi.fn(() => mockFirestore),
    doc: vi.fn((...args) => ({id: args.at(-1)})),
    setDoc: vi.fn(() => Promise.resolve()),
    getDoc: vi.fn(() => Promise.resolve({exists: () => true, data: () => ({})})),
    addDoc: vi.fn(() => Promise.resolve({id: 'mock-doc-id'})),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    collection: vi.fn(() => ({})),
    getDocs: vi.fn(() => Promise.resolve({docs: [], forEach: vi.fn()})),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    orderBy: vi.fn(() => ({})),

    // Analytics
    getAnalytics: vi.fn(() => ({})),
    logEvent: vi.fn(),

    // Messaging
    getMessaging: vi.fn(() => ({})),
    getToken: vi.fn(() => Promise.resolve('mock-fcm-token')),

    // Firebase AI Logic (Gemini API)
    getAI: vi.fn(() => ({})),
    getGenerativeModel: vi.fn(() => ({
        generateContent: vi.fn(() => Promise.resolve({
            response: {
                text: () => JSON.stringify([
                    {
                        quantity: "2",
                        unit: "cups",
                        ingredientName: "flour",
                        preparationNotes: null,
                        metricQuantity: "240",
                        metricUnit: "g",
                        confidence: 0.95,
                    }
                ]),
            },
        })),
    })),
    Schema: {
        object: vi.fn((config: any) => config),
        array: vi.fn((schema: any) => schema),
        string: vi.fn(() => 'string'),
        number: vi.fn(() => 'number'),
    },
    GoogleAIBackend: vi.fn(() => ({})),

    // Firebase Storage
    getStorage: vi.fn(() => ({})),
    ref: vi.fn((storage: any, path: string) => ({path, fullPath: path})),
    uploadBytes: vi.fn(() => Promise.resolve({
        metadata: {
            fullPath: 'mock/path/to/image.jpg',
            name: 'image.jpg',
            bucket: 'test-bucket',
        },
    })),
    getDownloadURL: vi.fn(() => Promise.resolve('https://firebasestorage.googleapis.com/mock-image-url.jpg')),
};

// Reset all mocks to initial state (defaults to unauthenticated)
export const resetFirebaseMocks = () => {
    // Trigger all callbacks with null BEFORE clearing the array
    // This ensures any active components get the null state
    for (const callback of authStateCallbacks) {
        callback(null);
    }

    currentMockUser = null;
    authStateCallbacks = [];

    for (const mock of Object.values(firebaseMocks)) {
        if (typeof mock === 'function' && 'mockClear' in mock) {
            (mock as Mock).mockClear();
        }
    }
};
