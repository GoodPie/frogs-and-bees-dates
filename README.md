[![Build Status](https://github.com/GoodPie/frogs-and-bees-dates/actions/workflows/firebase-hosting-merge.yml/badge.svg)](https://github.com/GoodPie/frogs-and-bees-dates/actions/workflows/firebase-hosting-merge.yml)
# Frog'n'Bee

[Frog'n'Bee](https://frognbee.com)

This application was designed to allow me and my partner to take the thinking out of dates. We can plot down some ideas at any time we think of something we want to do together and when it comes up to a date night or we are bored, we can go through our ideas.

## Initializing

1. `yarn && yarn build`

## Some Notes

- This repository is public so that I can take advantage of some cool features on GitHub and some external tools
- It is intended to be used by me and my partner and I have Firebase rules in place to prevent other users reading or writing
- Frog'n'Bee was used because it's our two favourite creatures

## Testing & Firebase Mocking

The test suite runs with **Vitest** (`npm test`) and does **not** contact real Firebase services. All Firebase modular SDK entry points used by the app (`firebase/app`, `firebase/analytics`, `firebase/auth`, `firebase/firestore`, `firebase/messaging`) are mocked in `setup-test.ts`.

### Why
Running unit tests against live Firebase resources is slower, flaky offline, and can leak data. By mocking we ensure:
* Deterministic tests (no network variance)
* No API key / service leakage
* Ability to assert interactions (e.g. that `setDoc` was called with expected args)

### How it works
`vite.config.ts` configures Vitest to load `setup-test.ts` before each test file. In that setup file we:
1. Create a JSDOM environment & polyfills (IntersectionObserver, ResizeObserver, etc.)
2. Mock Firebase modules via `vi.mock(...)` returning lightweight fakes
3. Expose the mocks on `global.__firebaseMocks` for targeted assertions inside tests
4. Mock the Web Notification API so permission requests resolve instantly.

### Extending Mocks
If you add new Firebase features (e.g. Storage, Functions, Remote Config) update `setup-test.ts`:
```ts
vi.mock('firebase/storage', () => ({ getStorage: () => ({ /* ... */ }), ref: vi.fn(), uploadBytes: vi.fn() }));
```
Then in tests you can assert with:
```ts
const { uploadBytes } = (global as any).__firebaseMocks;
expect(uploadBytes).toHaveBeenCalled();
```

### Writing Tests That Use Auth State
The mocked `getAuth()` returns a static `currentUser` object. If you need to simulate a sign-out or delayed sign-in, mutate it in your test:
```ts
const { getAuth } = (global as any).__firebaseMocks;
const auth = getAuth();
auth.currentUser = null; // simulate signed out
```
Or adjust the `onAuthStateChanged` mock to call back with different users.

### Avoiding Real Imports Elsewhere
Do not re-import Firebase directly inside tests; always import from app modules (e.g. `import { db } from '../FirebaseConfig'`) so the mocks are applied automatically.

### Troubleshooting
* If you see attempts to reach the network, ensure the import path matches exactly one of the mocked modules.
* Clearing mocks: call `vi.clearAllMocks()` in a `beforeEach` when side effects accumulate.

