import type { FC } from 'react';
import {
  Modal,
  ModalVariant,
  ModalBody,
  ModalHeader,
  Card,
  CardBody,
  Gallery,
  Title,
} from '@patternfly/react-core';
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { TaskModel, PipelineModel } from '../../../models';

export type ResourceType = 'task' | 'pipeline';

type AddResourceTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ResourceType) => void;
};

const AddResourceTypeModal: FC<AddResourceTypeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={t('Select')}
    >
      <ModalHeader title={t('Select')} />
      <ModalBody>
        <Gallery hasGutter>
          <Card
            isSelectable
            isCompact
            data-test="add-resource-type-task"
            onClick={() => {
              onSelect('task');
              onClose();
            }}
          >
            <CardBody>
              <ResourceIcon kind={getReferenceForModel(TaskModel)} />
              {' '}
              <Title headingLevel="h4" size="md">
                {t('Task')}
              </Title>
            </CardBody>
          </Card>
          <Card
            isSelectable
            isCompact
            data-test="add-resource-type-pipeline"
            onClick={() => {
              onSelect('pipeline');
              onClose();
            }}
          >
            <CardBody>
              <ResourceIcon kind={getReferenceForModel(PipelineModel)} />
              {' '}
              <Title headingLevel="h4" size="md">
                {t('Pipeline')}
              </Title>
            </CardBody>
          </Card>
        </Gallery>
      </ModalBody>
    </Modal>
  );
};

export default AddResourceTypeModal;
