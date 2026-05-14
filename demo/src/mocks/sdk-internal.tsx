import type { FC, ReactNode } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@patternfly/react-table';
import { Spinner } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';

// --- ConsoleDataView ---

type ConsoleDataViewProps = {
  label?: string;
  columns: Array<{ id: string; title: string | ReactNode; props?: any }>;
  data: any[];
  loaded: boolean;
  loadError?: any;
  getDataViewRows: (
    data: Array<{ obj: any; rowData: any }>,
    columns: any[],
  ) => any[][];
  customRowData?: Record<string, any>;
  hideColumnManagement?: boolean;
  hideNameLabelFilters?: boolean;
};

export const ConsoleDataView: FC<ConsoleDataViewProps> = ({
  label,
  columns,
  data,
  loaded,
  loadError,
  getDataViewRows,
  customRowData,
}) => {
  if (!loaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (loadError) {
    return <div style={{ padding: '1rem', color: '#c9190b' }}>Error: {String(loadError)}</div>;
  }

  if (!data || data.length === 0) {
    return <div style={{ padding: '1rem' }}>No {label || 'resources'} found</div>;
  }

  const wrappedData = data.map((obj) => ({
    obj,
    rowData: customRowData || {},
  }));

  let rows: any[][];
  try {
    rows = getDataViewRows(wrappedData, columns);
  } catch (e) {
    console.error('Error rendering data view rows:', e);
    return <div style={{ padding: '1rem', color: '#c9190b' }}>Error rendering table</div>;
  }

  return (
    <Table aria-label={label || 'Data table'} variant="compact">
      <Thead>
        <Tr>
          {columns.map((col) => (
            <Th key={col.id}>{col.title}</Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((row, rowIndex) => (
          <Tr key={rowIndex}>
            {row.map((cell: any, cellIndex: number) => (
              <Td key={cellIndex} {...(cell?.props || {})}>
                {cell?.cell ?? '-'}
              </Td>
            ))}
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

// --- LazyActionMenu ---

export const LazyActionMenu: FC<{ context?: any }> = () => (
  <button
    type="button"
    className="pf-v6-c-menu-toggle pf-m-plain"
    aria-label="Actions"
    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
  >
    <EllipsisVIcon />
  </button>
);

// --- Cell props helpers ---

export function getNameCellProps(_listId?: string) {
  return {};
}

export const actionsCellProps = {};
export const cellIsStickyProps = {};

// --- Types ---

export type GetDataViewRows<T = any, R = any> = (
  data: Array<{ obj: T; rowData: R }>,
  columns: any[],
) => any[][];

export type ActionMenuVariant = string;
