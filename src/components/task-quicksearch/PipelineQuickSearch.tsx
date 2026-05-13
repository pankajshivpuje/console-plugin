import type { FC } from 'react';
import { useRef, useState, memo, useMemo, useCallback } from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
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
import { QuickSearchController } from '../quick-search';
import {
  createArtifactHubTask,
  updateArtifactHubTask,
} from '../catalog/apis/artifactHub';
import { FLAGS } from '../../types';

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

  const pipelineCatalogItems = pipelineCatalogService.items.reduce(
    (acc, item) => {
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
    },
    [],
  );

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
    <div className="pf-v6-u-px-md pf-v6-u-pt-md pf-v6-u-pb-sm">
      <ToggleGroup aria-label={t('Resource type filter')}>
        <ToggleGroupItem
          text={t('Task')}
          isSelected={resourceKindFilter === 'task'}
          onChange={() => setResourceKindFilter('task')}
          data-test="toggle-task"
        />
        <ToggleGroupItem
          text={t('Pipeline')}
          isSelected={resourceKindFilter === 'pipeline'}
          onChange={() => setResourceKindFilter('pipeline')}
          data-test="toggle-pipeline"
        />
      </ToggleGroup>
    </div>
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
      searchPlaceholder={`${t('Add')}...`}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
      headerContent={headerContent}
      itemFilter={itemFilter}
      callback={savedCallback.current}
      setFailedTasks={setFailedTasks}
      detailsRenderer={detailsRenderer}
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
