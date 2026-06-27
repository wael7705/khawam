export const ASSISTANT_LOGO = '/images/khawam-assistant.png';

let ready = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

const preloadPromise = new Promise<void>((resolve) => {
  if (typeof window === 'undefined') {
    resolve();
    return;
  }

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    ready = true;
    notify();
    resolve();
  };
  img.onerror = () => resolve();
  img.src = ASSISTANT_LOGO;
});

export function isAssistantImageReady(): boolean {
  return ready;
}

export function whenAssistantImageReady(): Promise<void> {
  return ready ? Promise.resolve() : preloadPromise;
}

export function subscribeAssistantImageReady(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

void preloadPromise;
