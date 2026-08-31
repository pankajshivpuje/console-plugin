import type { FC, Ref } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import {
  Bullseye,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import type { LocalQueue } from '../__demo__/mock-localqueue-data';
import SchedulingPolicyBadge from './SchedulingPolicyBadge';
import LocalQueueStatusIcon from './LocalQueueStatusIcon';
import { TargetClusters } from './presenters';

export interface LocalQueuesTableProps {
  rows: LocalQueue[];
  onEdit: (lq: LocalQueue) => void;
  onDelete: (lq: LocalQueue) => void;
}

// ---- per-row kebab actions ----

const RowKebab: FC<{
  lq: LocalQueue;
  onEdit: (lq: LocalQueue) => void;
  onDelete: (lq: LocalQueue) => void;
}> = ({ lq, onEdit, onDelete }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [open, setOpen] = useState(false);

  return (
    <Dropdown
      isOpen={open}
      onSelect={() => setOpen(false)}
      onOpenChange={setOpen}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={`${t('Actions for')} ${lq.name}`}
          isExpanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem key="edit" component="button" onClick={() => onEdit(lq)}>
          {t('Edit')}
        </DropdownItem>
        <DropdownItem key="delete" component="button" onClick={() => onDelete(lq)}>
          {t('Delete')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

// ---- Table ----

const LocalQueuesTable: FC<LocalQueuesTableProps> = ({ rows, onEdit, onDelete }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const location = useLocation();
  const base = location.pathname.includes('dev-pipelines')
    ? 'dev-pipelines'
    : 'pipelines';

  if (rows.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No LocalQueues found')}</span>
      </Bullseye>
    );
  }

  return (
    <Table aria-label={t('LocalQueues')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Namespace')}</Th>
          <Th>{t('Scheduling Policy')}</Th>
          <Th>{t('Target Clusters')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Last Updated')}</Th>
          <Th screenReaderText={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((lq) => (
          <Tr key={`${lq.namespace}/${lq.name}`}>
            <Td dataLabel={t('Name')}>
              <Link to={`/${base}/ns/${lq.namespace}/local-queues/${lq.name}`}>
                {lq.name}
              </Link>
            </Td>
            <Td dataLabel={t('Namespace')}>{lq.namespace}</Td>
            <Td dataLabel={t('Scheduling Policy')}>
              <SchedulingPolicyBadge policy={lq.schedulingPolicy} />
            </Td>
            <Td dataLabel={t('Target Clusters')}>
              <TargetClusters lq={lq} />
            </Td>
            <Td dataLabel={t('Status')}>
              <LocalQueueStatusIcon status={lq.status} />
            </Td>
            <Td dataLabel={t('Last Updated')}>{lq.lastUpdated}</Td>
            <Td isActionCell>
              <RowKebab lq={lq} onEdit={onEdit} onDelete={onDelete} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default LocalQueuesTable;
