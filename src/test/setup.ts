import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { db } from '../features/pokedex/statusDb';

afterEach(async () => {
  cleanup();
  localStorage.clear();
  await db.statuses.clear();
});

// jsdom has no layout engine: ResizeObserver is missing and elements measure 0.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// The virtualized list reads its viewport from clientWidth/clientHeight; give
// every element a phone-sized box so it renders the first rows.
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 390 });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 844 });

// jsdom does not implement modal dialogs; emulate the open state and the
// "close" event, which is all the bottom sheets rely on.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};

// jsdom does not implement matchMedia; default to a light-mode device.
// Individual tests override it to simulate a dark-mode phone.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
