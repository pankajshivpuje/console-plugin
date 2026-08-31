import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import { LocalQueue } from '../__demo__/mock-localqueue-data';
import LocalQueuesTable from './LocalQueuesTable';
import LocalQueueModal, { LocalQueueFormValues } from './LocalQueueModal';
import LocalQueueDeleteModal from './LocalQueueDeleteModal';
import {
  useLocalQueues,
  createQueue,
  updateQueue,
  deleteQueue,
} from './localqueue-store';

interface ToastAlert {
  key: number;
  variant: AlertVariant;
  title: string;
}

const LocalQueuesList: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [searchParams, setSearchParams] = useSearchParams();

  const queues = useLocalQueues();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocalQueue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalQueue | null>(null);
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);
  const alertKeyRef = useRef(0);

  const addToast = (variant: AlertVariant, title: string) => {
    const key = ++alertKeyRef.current;
    setAlerts((prev) => [...prev, { key, variant, title }]);
  };

  const removeToast = (key: number) =>
    setAlerts((prev) => prev.filter((a) => a.key !== key));

  // Auto-open create modal when ?create=1 is present, then strip the param
  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setEditTarget(null);
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? queues.filter((lq) => lq.name.toLowerCase().includes(q)) : queues;
  }, [queues, search]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (lq: LocalQueue) => {
    setEditTarget(lq);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSubmit = (values: LocalQueueFormValues) => {
    // Validate: selected-spokes requires at least one spoke
    if (
      values.schedulingPolicy === 'selected-spokes' &&
      values.spokeClusterNames.length === 0
    ) {
      addToast(AlertVariant.danger, t('Select at least one spoke cluster.'));
      return;
    }

    if (editTarget) {
      // Edit: merge changes, update lastUpdated
      updateQueue(editTarget.namespace, editTarget.name, values);
      addToast(
        AlertVariant.success,
        `${t('LocalQueue')} "${values.name}" ${t('updated successfully.')}`,
      );
    } else {
      // Create: reject duplicate names
      if (queues.some((lq) => lq.name === values.name)) {
        addToast(AlertVariant.danger, t('A LocalQueue with this name already exists.'));
        return;
      }
      createQueue(values);
      addToast(
        AlertVariant.success,
        `${t('LocalQueue')} "${values.name}" ${t('created successfully.')}`,
      );
    }
    closeModal();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { name, namespace } = deleteTarget;
    deleteQueue(namespace, name);
    setDeleteTarget(null);
    addToast(AlertVariant.success, `${t('LocalQueue')} "${name}" ${t('deleted.')}`);
  };

  return (
    <ListPageBody>
      <Toolbar className="pf-v6-u-px-0">
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Search by name')}
              placeholder={t('Search by name...')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Button variant="primary" onClick={openCreate}>
              {t('Create LocalQueue')}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <LocalQueuesTable rows={filtered} onEdit={openEdit} onDelete={setDeleteTarget} />

      <div className="pf-v6-u-py-sm pf-v6-u-color-200">
        {t('{{count}} of {{total}} items', {
          count: filtered.length,
          total: queues.length,
        })}
      </div>

      <LocalQueueModal
        isOpen={modalOpen}
        editTarget={editTarget}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <LocalQueueDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <AlertGroup isToast isLiveRegion>
        {alerts.map((a) => (
          <Alert
            key={a.key}
            variant={a.variant}
            title={a.title}
            timeout={8000}
            onTimeout={() => removeToast(a.key)}
            actionClose={
              <AlertActionCloseButton
                title={a.title}
                onClose={() => removeToast(a.key)}
              />
            }
          />
        ))}
      </AlertGroup>
    </ListPageBody>
  );
};

export default LocalQueuesList;
