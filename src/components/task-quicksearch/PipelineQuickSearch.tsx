import type { FC } from 'react';
import { useRef, useState, memo, useMemo, useCallback } from 'react';
import { SearchIcon } from '@patternfly/react-icons/dist/esm/icons/search-icon';
import {
  Button,
  ButtonVariant,
  Radio,
} from '@patternfly/react-core';
import {
  CatalogItem,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import {
  useCleanupOnFailure,
  useLoadingTaskCleanup,
} from '../pipeline-builder/hooks';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipeline-builder/types';
import {
  createTask,
  findInstalledTask,
  getCtaButtonText,
  getSelectedVersionUrl,
  isArtifactHubTask,
  isTaskSearchable,
  TaskProviders,
  updateTask,
} from './pipeline-quicksearch-utils';
import { safeName } from '../pipeline-builder/utils';
import PipelineQuickSearchDetails from './PipelineQuickSearchDetails';
import PipelineQuickSearchPipelineDetails from './PipelineQuickSearchPipelineDetails';
import { CatalogServiceProvider } from '../catalog/service';
import { CatalogService } from '../catalog/types';
import { QuickSearchProviders } from './quick-search-types';
import { QuickSearchController, handleCta } from '../quick-search';
import {
  createArtifactHubTask,
  updateArtifactHubTask,
} from '../catalog/apis/artifactHub';
import { FLAGS } from '../../types';

const MOCK_PIPELINE_CATALOG_ITEMS: CatalogItem[] = [
  {
    uid: 'mock-pipeline-buildah-deploy',
    type: 'Red Hat',
    name: 'buildah-deploy',
    description:
      'Pipeline to build an application image using Buildah and deploy it to a Kubernetes cluster.',
    provider: 'Red Hat',
    tags: ['buildah', 'deploy', 'kubernetes'],
    creationTimestamp: '2025-11-01T10:00:00Z',
    icon: {
      node: <ResourceIcon kind="tekton.dev~v1~Pipeline" />,
    },
    attributes: {
      installed: '0.1',
      versions: [{ id: '0.1', version: '0.1' }],
      categories: ['Build', 'Deploy'],
      resourceKind: 'pipeline',
    },
    cta: { label: 'Add' },
    data: {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: { name: 'buildah-deploy', uid: 'mock-pipeline-buildah-deploy' },
      spec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
        workspaces: [
          { name: 'shared-workspace' },
          { name: 'docker-credentials' },
        ],
      },
    },
  },
  {
    uid: 'mock-pipeline-s2i-java',
    type: 'Red Hat',
    name: 's2i-java',
    description:
      'Source-to-Image pipeline for building and deploying Java applications using Maven and OpenShift S2I.',
    provider: 'Red Hat',
    tags: ['java', 's2i', 'maven'],
    creationTimestamp: '2025-10-15T08:30:00Z',
    icon: {
      node: <ResourceIcon kind="tekton.dev~v1~Pipeline" />,
    },
    attributes: {
      installed: '0.2',
      versions: [
        { id: '0.1', version: '0.1' },
        { id: '0.2', version: '0.2' },
      ],
      categories: ['Build', 'Java'],
      resourceKind: 'pipeline',
    },
    cta: { label: 'Add' },
    data: {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: { name: 's2i-java', uid: 'mock-pipeline-s2i-java' },
      spec: {
        tasks: [
          { name: 'fetch-repo', taskRef: { name: 'git-clone' } },
          { name: 'build', taskRef: { name: 's2i-java' } },
          { name: 'deploy', taskRef: { name: 'openshift-client' } },
          { name: 'verify', taskRef: { name: 'curl' } },
        ],
        workspaces: [{ name: 'workspace' }],
      },
    },
  },
  {
    uid: 'mock-pipeline-docker-build-push',
    type: 'Red Hat',
    name: 'docker-build-push',
    description:
      'Pipeline to build a Docker image from source and push it to an external container registry.',
    provider: 'Red Hat',
    tags: ['docker', 'build', 'push', 'registry'],
    creationTimestamp: '2025-09-20T14:00:00Z',
    icon: {
      node: <ResourceIcon kind="tekton.dev~v1~Pipeline" />,
    },
    attributes: {
      installed: '0.3',
      versions: [
        { id: '0.1', version: '0.1' },
        { id: '0.2', version: '0.2' },
        { id: '0.3', version: '0.3' },
      ],
      categories: ['Build', 'Image'],
      resourceKind: 'pipeline',
    },
    cta: { label: 'Add' },
    data: {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: {
        name: 'docker-build-push',
        uid: 'mock-pipeline-docker-build-push',
      },
      spec: {
        tasks: [
          { name: 'clone', taskRef: { name: 'git-clone' } },
          { name: 'build-and-push', taskRef: { name: 'kaniko' } },
        ],
        workspaces: [
          { name: 'source' },
          { name: 'dockerconfig' },
        ],
      },
    },
  },
  {
    uid: 'mock-pipeline-nodejs-deploy',
    type: 'Red Hat',
    name: 'nodejs-deploy',
    description:
      'Pipeline to build, test, and deploy a Node.js application with npm, including linting and unit tests.',
    provider: 'Red Hat',
    tags: ['nodejs', 'npm', 'deploy'],
    creationTimestamp: '2025-08-10T09:15:00Z',
    icon: {
      node: <ResourceIcon kind="tekton.dev~v1~Pipeline" />,
    },
    attributes: {
      installed: '0.1',
      versions: [{ id: '0.1', version: '0.1' }],
      categories: ['Build', 'Deploy', 'Node.js'],
      resourceKind: 'pipeline',
    },
    cta: { label: 'Add' },
    data: {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: { name: 'nodejs-deploy', uid: 'mock-pipeline-nodejs-deploy' },
      spec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'install-deps', taskRef: { name: 'npm' } },
          { name: 'run-tests', taskRef: { name: 'npm' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy-app', taskRef: { name: 'openshift-client' } },
        ],
        workspaces: [{ name: 'shared-workspace' }, { name: 'npm-cache' }],
      },
    },
  },
  {
    uid: 'mock-pipeline-scan-and-deploy',
    type: 'Red Hat',
    name: 'scan-and-deploy',
    description:
      'Security-focused pipeline that scans container images for vulnerabilities before deploying to production.',
    provider: 'Red Hat',
    tags: ['security', 'scan', 'deploy'],
    creationTimestamp: '2025-07-05T16:45:00Z',
    icon: {
      node: <ResourceIcon kind="tekton.dev~v1~Pipeline" />,
    },
    attributes: {
      installed: '0.1',
      versions: [{ id: '0.1', version: '0.1' }],
      categories: ['Security', 'Deploy'],
      resourceKind: 'pipeline',
    },
    cta: { label: 'Add' },
    data: {
      apiVersion: 'tekton.dev/v1',
      kind: 'Pipeline',
      metadata: {
        name: 'scan-and-deploy',
        uid: 'mock-pipeline-scan-and-deploy',
      },
      spec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'scan-image', taskRef: { name: 'trivy-scanner' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
        workspaces: [{ name: 'workspace' }, { name: 'scan-results' }],
      },
    },
  },
];

interface QuickSearchProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
}

const Contents: FC<
  {
    taskCatalogService: CatalogService;
    pipelineCatalogService: CatalogService;
  } & QuickSearchProps
> = ({
  taskCatalogService,
  pipelineCatalogService,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const savedCallback = useRef(null);
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  savedCallback.current = callback;
  const [failedTasks, setFailedTasks] = useState<string[]>([]);
  const [resourceKindFilter, setResourceKindFilter] = useState<
    'task' | 'pipeline'
  >('task');

  useLoadingTaskCleanup(onUpdateTasks, taskGroup);
  useCleanupOnFailure(failedTasks, onUpdateTasks, taskGroup);

  const getExistingTaskNames = (): string[] => {
    const taskNames = new Set<string>();
    [
      ...taskGroup.tasks,
      ...taskGroup.finallyTasks,
      ...taskGroup.listTasks,
      ...taskGroup.loadingTasks,
      ...taskGroup.finallyListTasks,
    ].forEach((t) => {
      if (t?.name) taskNames.add(t.name);
    });

    taskCatalogService.items.forEach((catalogItem) => {
      const name = catalogItem.data?.metadata?.name;
      if (name) taskNames.add(name);
    });
    return Array.from(taskNames);
  };

  const handleTaskCreationWithNameConflict = (
    taskName: string,
    createTaskFn: (taskNameToUse?: string) => Promise<any>,
    resolve: (value: any) => void,
  ) => {
    const existingTaskNames = getExistingTaskNames();
    if (existingTaskNames.includes(taskName)) {
      const taskNameToUse = safeName(existingTaskNames, taskName);
      createTaskFn(taskNameToUse)
        .then(() =>
          resolve(
            savedCallback.current({
              metadata: { name: taskNameToUse },
            }),
          ),
        )
        .catch(() => setFailedTasks([...failedTasks, taskNameToUse]));
    } else {
      resolve(savedCallback.current({ metadata: { name: taskName } }));
      createTaskFn().catch(() => setFailedTasks([...failedTasks, taskName]));
    }
  };

  const taskCatalogItems = taskCatalogService.items.reduce((acc, item) => {
    const installedTask = findInstalledTask(taskCatalogService.items, item);

    if (
      (item.provider === TaskProviders.artifactHub ||
        item.provider === TaskProviders.tektonHub) &&
      item.type !== TaskProviders.redhat
    ) {
      item.attributes.installed = '';
      if (installedTask) {
        item.attributes.installed =
          installedTask.attributes?.versions[0]?.version?.toString();
      }
    }

    item.attributes.resourceKind = 'task';

    item.cta.callback = ({ selectedVersion }) => {
      return new Promise((resolve) => {
        if (!isArtifactHubTask(item)) {
          if (item.provider === TaskProviders.tektonHub) {
            const selectedVersionUrl = getSelectedVersionUrl(
              item,
              selectedVersion,
            );
            if (installedTask) {
              if (selectedVersion === item.attributes.installed) {
                resolve(savedCallback.current(installedTask.data));
              } else {
                resolve(
                  savedCallback.current({ metadata: { name: item.data.name } }),
                );
                updateTask(
                  selectedVersionUrl,
                  installedTask,
                  namespace,
                  item.data.name,
                ).catch(() => setFailedTasks([...failedTasks, item.data.name]));
              }
            } else {
              handleTaskCreationWithNameConflict(
                item.data.name,
                (taskNameToUse) =>
                  createTask(selectedVersionUrl, namespace, taskNameToUse),
                resolve,
              );
            }
          } else {
            resolve(savedCallback.current(item.data));
          }
        }

        if (
          item.provider === TaskProviders.artifactHub &&
          isArtifactHubTask(item)
        ) {
          const selectedVersionUrl = getSelectedVersionUrl(
            item,
            selectedVersion,
          );
          if (installedTask) {
            if (selectedVersion === item.attributes.installed) {
              resolve(savedCallback.current(installedTask.data));
            } else {
              resolve(
                savedCallback.current({
                  metadata: { name: item.data.task.name },
                }),
              );
              updateArtifactHubTask(
                selectedVersionUrl,
                installedTask,
                namespace,
                item.data.task.name,
                selectedVersion,
                isDevConsoleProxyAvailable,
              ).catch(() =>
                setFailedTasks([...failedTasks, item.data.task.name]),
              );
            }
          } else {
            handleTaskCreationWithNameConflict(
              item.data.task.name,
              (taskNameToUse) =>
                createArtifactHubTask(
                  selectedVersionUrl,
                  namespace,
                  selectedVersion,
                  isDevConsoleProxyAvailable,
                  taskNameToUse,
                ),
              resolve,
            );
          }
        }
      });
    };

    if (isTaskSearchable(taskCatalogService.items, item)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const pipelineCatalogItems = [
    ...pipelineCatalogService.items,
    ...MOCK_PIPELINE_CATALOG_ITEMS,
  ].reduce((acc, item) => {
    item.attributes.resourceKind = 'pipeline';

    item.cta.callback = () => {
      return new Promise((resolve) => {
        resolve(savedCallback.current(item.data));
      });
    };

    if (isTaskSearchable(pipelineCatalogService.items, item)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'pipelinesTaskCatalog',
      items: taskCatalogItems,
      loaded: taskCatalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) =>
        `/search/ns/${ns}?keyword=${searchTerm}`,
      catalogLinkLabel: t('View all tekton tasks ({{itemCount, number}})'),
      extensions: taskCatalogService.catalogExtensions,
    },
    {
      catalogType: 'pipelinesPipelineCatalog',
      items: pipelineCatalogItems,
      loaded: pipelineCatalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) =>
        `/search/ns/${ns}?keyword=${searchTerm}`,
      catalogLinkLabel: t('View all pipelines ({{itemCount, number}})'),
      extensions: pipelineCatalogService.catalogExtensions,
    },
  ];

  const allItemsLoaded =
    taskCatalogService.loaded && pipelineCatalogService.loaded;

  const itemFilter = useMemo(
    () => (item: CatalogItem) =>
      (item.attributes?.resourceKind || 'task') === resourceKindFilter,
    [resourceKindFilter],
  );

  const headerContent = (
    <div className="pf-v6-u-px-md pf-v6-u-py-md pf-v6-u-display-flex pf-v6-u-flex-direction-row" style={{ gap: '2rem' }}>
      <Radio
        id="resource-type-task"
        name="resource-type"
        label={t('Task')}
        isChecked={resourceKindFilter === 'task'}
        onChange={() => setResourceKindFilter('task')}
        data-test="radio-task"
      />
      <Radio
        id="resource-type-pipeline"
        name="resource-type"
        label={t('Pipeline')}
        isChecked={resourceKindFilter === 'pipeline'}
        onChange={() => setResourceKindFilter('pipeline')}
        data-test="radio-pipeline"
      />
    </div>
  );

  const footerRenderer = useCallback(
    ({ selectedItem: item, selectedVersion: version, closeModal: close }) => {
      return (
        <>
          <Button
            data-test="quick-search-cta"
            variant={ButtonVariant.primary}
            isDisabled={!item}
            onClick={(e) => {
              handleCta(e, item, close, navigate, {
                selectedVersion: version,
                namespace,
                callback: savedCallback.current,
                setFailedTasks,
                isDevConsoleProxyAvailable,
              });
            }}
          >
            {item ? getCtaButtonText(item, version) : t('Add')}
          </Button>
          <Button
            data-test="quick-search-cancel"
            variant={ButtonVariant.link}
            onClick={close}
          >
            {t('Cancel')}
          </Button>
        </>
      );
    },
    [navigate, namespace, setFailedTasks, isDevConsoleProxyAvailable, t],
  );

  const detailsRenderer = useCallback(
    (props) =>
      props.selectedItem?.attributes?.resourceKind === 'pipeline' ? (
        <PipelineQuickSearchPipelineDetails {...props} />
      ) : (
        <PipelineQuickSearchDetails {...props} />
      ),
    [],
  );

  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={allItemsLoaded}
      searchPlaceholder={t('Find by name...')}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      icon={<SearchIcon />}
      title={t('Select')}
      headerContent={headerContent}
      itemFilter={itemFilter}
      callback={savedCallback.current}
      setFailedTasks={setFailedTasks}
      detailsRenderer={detailsRenderer}
      footerRenderer={footerRenderer}
    />
  );
};

const PipelineQuickSearch: FC<QuickSearchProps> = ({
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
}) => {
  return (
    <CatalogServiceProvider
      namespace={namespace}
      catalogId="pipelines-task-catalog"
    >
      {(taskCatalogService: CatalogService) => (
        <CatalogServiceProvider
          namespace={namespace}
          catalogId="pipelines-pipeline-catalog"
        >
          {(pipelineCatalogService: CatalogService) => (
            <Contents
              {...{
                namespace,
                viewContainer,
                isOpen,
                setIsOpen,
                taskCatalogService,
                pipelineCatalogService,
                callback,
                onUpdateTasks,
                taskGroup,
              }}
            />
          )}
        </CatalogServiceProvider>
      )}
    </CatalogServiceProvider>
  );
};

export default memo(PipelineQuickSearch);
