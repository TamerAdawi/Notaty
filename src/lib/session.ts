// Runtime storage-mode switch. `isCloud` (from supabase.ts) is decided at build
// time by whether env keys exist — in production it's always true. Guest mode is
// a *runtime* override that forces the on-device (localStorage) backend even when
// cloud keys are present, so the live deployment can offer a no-account demo.
import { isCloud } from './supabase';

const KEY = 'notaty.guest';

let guest = false;
try {
  guest = localStorage.getItem(KEY) === '1';
} catch {
  /* SSR / no storage */
}

export function isGuest(): boolean {
  return guest;
}

export function enterGuest(): void {
  guest = true;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export function exitGuest(): void {
  guest = false;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** True when the data layer should use localStorage: no cloud, or a guest demo. */
export function usingLocal(): boolean {
  return !isCloud || guest;
}
