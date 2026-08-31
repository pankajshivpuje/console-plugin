import {
  getQueues,
  getQueue,
  createQueue,
  updateQueue,
  deleteQueue,
  subscribe,
  resetQueues,
} from '../localqueue-store';
import { MOCK_LOCAL_QUEUES } from '../../__demo__/mock-localqueue-data';

describe('localqueue-store', () => {
  beforeEach(() => {
    resetQueues();
  });

  it('seeds from MOCK_LOCAL_QUEUES', () => {
    expect(getQueues()).toHaveLength(MOCK_LOCAL_QUEUES.length);
    expect(getQueues().map((q) => q.name)).toEqual(
      MOCK_LOCAL_QUEUES.map((q) => q.name),
    );
  });

  it('getQueues returns a stable reference that only changes on mutation', () => {
    // Stable identity between reads is required by useSyncExternalStore.
    expect(getQueues()).toBe(getQueues());
    const before = getQueues();
    deleteQueue(MOCK_LOCAL_QUEUES[0].namespace, MOCK_LOCAL_QUEUES[0].name);
    expect(getQueues()).not.toBe(before);
  });

  it('getQueue finds by namespace + name', () => {
    const seed = MOCK_LOCAL_QUEUES[2];
    const found = getQueue(seed.namespace, seed.name);
    expect(found?.name).toBe(seed.name);
  });

  it('getQueue returns undefined for an unknown name', () => {
    expect(getQueue('team-alpha', 'does-not-exist')).toBeUndefined();
  });

  it('getQueue returns undefined when the name matches but namespace does not', () => {
    const seed = MOCK_LOCAL_QUEUES[0];
    expect(getQueue('wrong-namespace', seed.name)).toBeUndefined();
  });

  it('createQueue prepends a Pending queue and defaults clusterQueue + quota', () => {
    const created = createQueue({
      name: 'new-queue',
      namespace: 'team-alpha',
      resourceFlavor: 'default',
      schedulingPolicy: 'hub-only',
      spokeClusterNames: [],
    });
    expect(created.status).toBe('Pending');
    expect(created.clusterQueue).toBeTruthy();
    expect(created.quota.cpu.total).toBeGreaterThan(0);
    expect(getQueues()[0].name).toBe('new-queue');
    expect(getQueues()).toHaveLength(MOCK_LOCAL_QUEUES.length + 1);
  });

  it('updateQueue merges changes and marks lastUpdated', () => {
    const seed = MOCK_LOCAL_QUEUES[0];
    const updated = updateQueue(seed.namespace, seed.name, {
      name: seed.name,
      namespace: seed.namespace,
      resourceFlavor: 'high-memory',
      schedulingPolicy: 'hub-only',
      spokeClusterNames: [],
    });
    expect(updated?.resourceFlavor).toBe('high-memory');
    expect(updated?.schedulingPolicy).toBe('hub-only');
    expect(getQueue(seed.namespace, seed.name)?.resourceFlavor).toBe('high-memory');
  });

  it('updateQueue returns undefined for an unknown queue', () => {
    expect(
      updateQueue('team-alpha', 'nope', {
        name: 'nope',
        namespace: 'team-alpha',
        resourceFlavor: 'default',
        schedulingPolicy: 'hub-only',
        spokeClusterNames: [],
      }),
    ).toBeUndefined();
  });

  it('deleteQueue removes the matching queue', () => {
    const seed = MOCK_LOCAL_QUEUES[4];
    deleteQueue(seed.namespace, seed.name);
    expect(getQueue(seed.namespace, seed.name)).toBeUndefined();
    expect(getQueues()).toHaveLength(MOCK_LOCAL_QUEUES.length - 1);
  });

  it('subscribe fires listeners on mutation and stops after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = subscribe(listener);
    deleteQueue(MOCK_LOCAL_QUEUES[0].namespace, MOCK_LOCAL_QUEUES[0].name);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    createQueue({
      name: 'after-unsub',
      namespace: 'team-alpha',
      resourceFlavor: 'default',
      schedulingPolicy: 'hub-only',
      spokeClusterNames: [],
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
