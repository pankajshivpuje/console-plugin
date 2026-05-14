// Catch-all for deep imports from @openshift-console/dynamic-plugin-sdk/lib/...
// Each deep import path resolves here.

import type { FC, PropsWithChildren } from 'react';
import { createElement } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  SyncAltIcon,
  HourglassHalfIcon,
  BanIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';

const STATUS_MAP: Record<string, { icon: FC; color: string }> = {
  Succeeded: { icon: CheckCircleIcon, color: '#3e8635' },
  Failed: { icon: ExclamationCircleIcon, color: '#c9190b' },
  Running: { icon: SyncAltIcon, color: '#0066cc' },
  'In Progress': { icon: SyncAltIcon, color: '#0066cc' },
  Pending: { icon: HourglassHalfIcon, color: '#f0ab00' },
  PipelineNotStarted: { icon: HourglassHalfIcon, color: '#6a6e73' },
  Cancelled: { icon: BanIcon, color: '#6a6e73' },
  Cancelling: { icon: BanIcon, color: '#6a6e73' },
  Skipped: { icon: BanIcon, color: '#6a6e73' },
};

export const Status: FC<PropsWithChildren<{ status?: string; title?: string }>> = ({ status, title, children }) => {
  const label = title || status || '';
  const entry = STATUS_MAP[label] || { icon: QuestionCircleIcon, color: '#6a6e73' };
  return createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
    createElement(entry.icon as any, { color: entry.color, style: { width: '14px', height: '14px' } }),
    createElement('span', null, label),
    children,
  );
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
