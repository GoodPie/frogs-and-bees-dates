import { firebaseMocks } from './firebase';

declare global {
  var __firebaseMocks: typeof firebaseMocks;
}

export {};