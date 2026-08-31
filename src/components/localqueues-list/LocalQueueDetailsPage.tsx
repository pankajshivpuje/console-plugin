import type { FC, Ref } from 'react';
import { useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import LocalQueueStatusIcon from './LocalQueueStatusIcon';
import LocalQueueDetailsTab from './LocalQueueDetailsTab';
import LocalQueueWorkloadsTab from './LocalQueueWorkloadsTab';
import LocalQueueYAMLTab from './LocalQueueYAMLTab';
import LocalQueueModal, { LocalQueueFormValues } from './LocalQueueModal';
import LocalQueueDeleteModal from './LocalQueueDeleteModal';
import { useLocalQueues, updateQueue, deleteQueue } from './localqueue-store';

const LocalQueueDetailsPage: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns = '', name = '' } = useParams<{ ns: string; name: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const base = location.pathname.includes('dev-pipelines')
    ? 'dev-pipelines'
    : 'pipelines';
  const listPath = `/${base}/ns/${ns}/local-queues`;

  const queues = useLocalQueues();
  const lq = queues.find((q) => q.namespace === ns && q.name === name);

  const [activeTab, setActiveTab] = useState<string | number>('details');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!lq) {
    return (
      <PageSection>
        <EmptyState titleText={t('LocalQueue not found')} headingLevel="h2">
          <EmptyStateBody>
            {t('The requested LocalQueue does not exist or has been deleted.')}{' '}
            <Link to={listPath}>{t('Back to LocalQueues')}</Link>
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  const handleEditSubmit = (values: LocalQueueFormValues) => {
    updateQueue(lq.namespace, lq.name, values);
    setEditOpen(false);
  };

  const handleConfirmDelete = () => {
    deleteQueue(lq.namespace, lq.name);
    setDeleteOpen(false);
    navigate(listPath);
  };

  return (
    <>
      <PageSection type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem to={`/${base}`} component="div">
            <Link to={`/${base}`}>{t('Pipelines')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem component="div">
            <Link to={listPath}>{t('LocalQueues')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{lq.name}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>

      <PageSection>
        <Flex
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Flex
              gap={{ default: 'gapMd' }}
              alignItems={{ default: 'alignItemsCenter' }}
            >
              <FlexItem>
                <Title headingLevel="h1">{lq.name}</Title>
              </FlexItem>
              <FlexItem>
                <LocalQueueStatusIcon status={lq.status} />
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Dropdown
              isOpen={actionsOpen}
              onSelect={() => setActionsOpen(false)}
              onOpenChange={setActionsOpen}
              popperProps={{ position: 'right' }}
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label={t('Actions')}
                  isExpanded={actionsOpen}
                  onClick={() => setActionsOpen((o) => !o)}
                >
                  {t('Actions')}
                  <EllipsisVIcon className="pf-v6-u-ml-sm" />
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem
                  key="edit"
                  component="button"
                  onClick={() => setEditOpen(true)}
                >
                  {t('Edit')}
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  component="button"
                  onClick={() => setDeleteOpen(true)}
                >
                  {t('Delete')}
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </FlexItem>
        </Flex>
      </PageSection>

      <PageSection type="tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key)}
          aria-label={t('LocalQueue detail tabs')}
        >
          <Tab
            eventKey="details"
            title={<TabTitleText>{t('Details')}</TabTitleText>}
          >
            {activeTab === 'details' && <LocalQueueDetailsTab lq={lq} />}
          </Tab>
          <Tab eventKey="yaml" title={<TabTitleText>{t('YAML')}</TabTitleText>}>
            {activeTab === 'yaml' && <LocalQueueYAMLTab lq={lq} />}
          </Tab>
          <Tab
            eventKey="workloads"
            title={<TabTitleText>{t('Workloads')}</TabTitleText>}
          >
            {activeTab === 'workloads' && (
              <LocalQueueWorkloadsTab queueName={lq.name} />
            )}
          </Tab>
        </Tabs>
      </PageSection>

      <LocalQueueModal
        isOpen={editOpen}
        editTarget={lq}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <LocalQueueDeleteModal
        target={deleteOpen ? lq : null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default LocalQueueDetailsPage;
