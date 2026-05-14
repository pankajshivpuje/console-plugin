import type { FC, PropsWithChildren, ReactNode } from 'react';

// --- Components ---

export const ResourceLink: FC<{
  groupVersionKind?: any;
  name?: string;
  namespace?: string;
  className?: string;
  [key: string]: any;
}> = ({ name, namespace }) => (
  <span className="co-resource-item">
    <span className="co-resource-item__resource-name">{name}</span>
    {namespace && (
      <span className="co-resource-item__resource-namespace text-muted">
        {' '}
        ({namespace})
      </span>
    )}
  </span>
);

export const ResourceIcon: FC<{ kind?: string; className?: string }> = ({
  kind,
}) => (
  <span
    className="co-m-resource-icon"
    title={kind}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '16px',
      height: '16px',
      fontSize: '10px',
      fontWeight: 'bold',
      borderRadius: '2px',
      backgroundColor: '#0066CC',
      color: 'white',
      marginRight: '4px',
    }}
  >
    {kind?.split('~').pop()?.[0]?.toUpperCase() || 'R'}
  </span>
);

export const Timestamp: FC<{
  timestamp?: string;
  className?: string;
  [key: string]: any;
}> = ({ timestamp }) => {
  if (!timestamp) return <span>-</span>;
  try {
    return <span>{new Date(timestamp).toLocaleString()}</span>;
  } catch {
    return <span>{timestamp}</span>;
  }
};

export const ListPageBody: FC<PropsWithChildren> = ({ children }) => (
  <div className="co-m-pane__body">{children}</div>
);

export const ListPageHeader: FC<PropsWithChildren<{ title?: string }>> = ({
  title,
  children,
}) => (
  <div className="co-m-pane__heading">
    {title && <h1 className="co-m-pane__heading--center">{title}</h1>}
    {children}
  </div>
);

export const NamespaceBar: FC<PropsWithChildren> = ({ children }) => (
  <div className="co-namespace-bar">{children}</div>
);

export const DocumentTitle: FC<PropsWithChildren<{ title?: string }>> = ({
  children,
}) => <>{children}</>;

export const ModelBadge: FC<{ model?: any }> = ({ model }) => (
  <span className="co-model-badge">{model?.kind || ''}</span>
);

export const CatalogItemBadge: FC<{ text?: string }> = ({ text }) => (
  <span className="co-catalog-item-badge">{text || ''}</span>
);

export const ResourceStatus: FC<PropsWithChildren> = ({ children }) => (
  <span className="co-resource-status">{children}</span>
);

export const CamelCaseWrap: FC<PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

export const YellowExclamationTriangleIcon: FC = () => (
  <span style={{ color: '#f0ab00' }}>&#9888;</span>
);

export const RedExclamationCircleIcon: FC = () => (
  <span style={{ color: '#c9190b' }}>&#9888;</span>
);

export const Selector: FC<{ selector?: any; namespace?: string }> = () => (
  <span>-</span>
);

export const NavPage: FC<PropsWithChildren> = ({ children }) => (
  <>{children}</>
);

// --- Hooks ---

export function useK8sWatchResource(_resource: any): [any[], boolean, any] {
  return [[], true, null];
}

export function useK8sWatchResources(_resources: any): Record<string, any> {
  return {};
}

export function useFlag(_flag: string): boolean {
  return true;
}

export function useActiveNamespace(): [string, (ns: string) => void] {
  return ['default', () => {}];
}

export function useAccessReview(_review: any): [boolean, boolean] {
  return [true, true];
}

export function useOverlay(): (
  component: any,
  props?: any,
) => { close: () => void } {
  return (_component: any, _props?: any) => ({ close: () => {} });
}

// --- K8s API functions ---

export function getGroupVersionKindForModel(model: any) {
  return {
    group: model?.apiGroup || '',
    version: model?.apiVersion || 'v1',
    kind: model?.kind || '',
  };
}

export function getAPIVersionForModel(model: any): string {
  if (model?.apiGroup) return `${model.apiGroup}/${model.apiVersion || 'v1'}`;
  return model?.apiVersion || 'v1';
}

export async function k8sCreate(_options: any) {
  return {};
}

export async function k8sGet(_options: any) {
  return {};
}

export async function k8sPatch(_options: any) {
  return {};
}

export async function k8sListItems(_model: any, _options?: any) {
  return [];
}

export async function k8sUpdate(_options: any) {
  return {};
}

export async function k8sDelete(_options: any) {
  return {};
}

export async function k8sKill(_options: any) {
  return {};
}

export async function k8sList(_model: any, _options?: any) {
  return { items: [] };
}

export function getGroupVersionKindForResource(_resource: any) {
  return { group: '', version: 'v1', kind: '' };
}

export async function consoleFetch(
  _url: string,
  _options?: any,
): Promise<Response> {
  return new Response(JSON.stringify({}), { status: 200 });
}

export async function consoleFetchJSON(_url: string, _options?: any) {
  return {};
}

export async function consoleFetchText(_url: string, _options?: any) {
  return '';
}

// --- Types (re-exported as empty interfaces/types for compatibility) ---

export type K8sKind = any;
export type K8sModel = any;
export type K8sResourceCommon = any;
export type K8sResourceKind = any;
export type K8sResourceKindReference = string;
export type K8sVerb = string;
export type TableColumn<T = any> = {
  id: string;
  title: string | ReactNode;
  sort?: string | ((a: any, b: any) => number);
  sortFunc?: string;
  props?: any;
};
export type RowFilter<T = any> = any;
export type CatalogItem = any;
export type FirehoseResult = any;
export type DetailsTabSectionExtensionHook = any;
export type PrometheusEndpoint = any;
export type PrometheusResponse = any;
export type UserInfo = any;
export type OverlayComponent = any;
export type LaunchOverlay = any;

// Default export for `import * as k8sResourceModule`
const sdk = {
  ResourceLink,
  Timestamp,
  useK8sWatchResource,
  useK8sWatchResources,
  useFlag,
  useActiveNamespace,
  useAccessReview,
  useOverlay,
  getGroupVersionKindForModel,
  getAPIVersionForModel,
  k8sCreate,
  k8sGet,
  k8sPatch,
  k8sListItems,
  consoleFetch,
  consoleFetchJSON,
  consoleFetchText,
};

export default sdk;
