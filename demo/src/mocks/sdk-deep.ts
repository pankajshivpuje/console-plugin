// Catch-all for deep imports from @openshift-console/dynamic-plugin-sdk/lib/...
// Each deep import path resolves here.

import type { FC } from 'react';

// Status component
export const Status: FC<{ status?: string }> = ({ status }) => {
  return null;
};
export default Status;

// Error types
export class HttpError extends Error {
  public response: any;
  public json: any;
  constructor(message: string, statusCode?: number, json?: any) {
    super(message);
    this.name = 'HttpError';
    this.response = { status: statusCode || 500 };
    this.json = json;
  }
}

export class IncompleteDataError extends Error {
  public labels: any;
  constructor(message: string, labels?: any) {
    super(message);
    this.name = 'IncompleteDataError';
    this.labels = labels;
  }
}

// WSFactory
export class WSFactory {
  constructor(_id: string, _options?: any) {}
  onmessage(_fn: any) { return this; }
  onclose(_fn: any) { return this; }
  onerror(_fn: any) { return this; }
  onopen(_fn: any) { return this; }
  onbulkmessage(_fn: any) { return this; }
  destroy() {}
}

// Redux types
export type SDKStoreState = any;

// Internal API types
export type GetDataViewRows<T = any, R = any> = (
  data: Array<{ obj: T; rowData: R }>,
  columns: any[],
) => any[][];

export type UseURLPoll = any;
export type ActionMenuVariant = string;
export type LaunchOverlay = any;
