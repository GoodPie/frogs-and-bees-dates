import { firebaseMocks } from './firebase';

declare global {
  const __firebaseMocks: typeof firebaseMocks;
}

export {};