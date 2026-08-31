import { useSyncExternalStore } from 'react';
import { MOCK_LOCAL_QUEUES, LocalQueue } from '../__demo__/mock-localqueue-data';
import type { LocalQueueFormValues } from './LocalQueueModal';

// ---------------------------------------------------------------------------
// Module-level in-memory store for LocalQueues.
//
// LocalQueue data is mock-only (no API/redux). The list tab and the detail
// route mount as separate console routes, so React Context cannot be shared
// between them. This singleton is imported by both, keeping create/edit/delete
// consistent for the session and surviving navigation between list and detail.
// ---------------------------------------------------------------------------

const seed = (): LocalQueue[] => MOCK_LOCAL_QUEUES.map((q) => ({ ...q }));

let queues: LocalQueue[] = seed();

const listeners = new Set<() => void>();

const emit = () => {
  listeners.forEach((l) => l());
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Snapshot is the array reference itself; mutations always replace it so
// useSyncExternalStore can detect changes by identity.
export const getQueues = (): LocalQueue[] => queues;

export const getQueue = (
  namespace: string,
  name: string,
): LocalQueue | undefined =>
  queues.find((q) => q.namespace === namespace && q.name === name);

export const createQueue = (values: LocalQueueFormValues): LocalQueue => {
  const created: LocalQueue = {
    ...values,
    status: 'Pending',
    lastUpdated: 'Just now',
    clusterQueue: 'fleet-shared-cq',
    quota: { cpu: { used: 0, total: 16 }, memoryGi: { used: 0, total: 64 } },
  };
  queues = [created, ...queues];
  emit();
  return created;
};

export const updateQueue = (
  namespace: string,
  name: string,
  values: LocalQueueFormValues,
): LocalQueue | undefined => {
  const existing = getQueue(namespace, name);
  if (!existing) {
    return undefined;
  }
  const updated: LocalQueue = { ...existing, ...values, lastUpdated: 'Just now' };
  queues = queues.map((q) =>
    q.namespace === namespace && q.name === name ? updated : q,
  );
  emit();
  return updated;
};

export const deleteQueue = (namespace: string, name: string): void => {
  queues = queues.filter(
    (q) => !(q.namespace === namespace && q.name === name),
  );
  emit();
};

// Reset to the seed data — used by tests to isolate module-level state.
export const resetQueues = (): void => {
  queues = seed();
  emit();
};

// React hook: re-renders the caller whenever the store changes.
export const useLocalQueues = (): LocalQueue[] =>
  useSyncExternalStore(subscribe, getQueues, getQueues);
