import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Content,
} from '@patternfly/react-core';
import type { LocalQueue } from '../__demo__/mock-localqueue-data';

export interface LocalQueueDeleteModalProps {
  target: LocalQueue | null;
  onClose: () => void;
  onConfirm: () => void;
}

const LocalQueueDeleteModal: FC<LocalQueueDeleteModalProps> = ({
  target,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!target) {
    return null;
  }
  return (
    <Modal variant="small" isOpen onClose={onClose}>
      <ModalHeader title={t('Delete LocalQueue')} titleIconVariant="warning" />
      <ModalBody>
        <Content component="p">
          {t('Are you sure you want to delete LocalQueue')}{' '}
          <strong>{target.name}</strong>?
        </Content>
        <Content component="p" className="pf-v6-u-color-200">
          {t(
            'This action cannot be undone. Any PipelineRuns referencing this LocalQueue will lose their scheduling configuration.',
          )}
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button key="delete" variant="danger" onClick={onConfirm}>
          {t('Delete')}
        </Button>
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default LocalQueueDeleteModal;
