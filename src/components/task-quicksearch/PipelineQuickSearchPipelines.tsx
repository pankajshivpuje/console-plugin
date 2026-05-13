import type { FC } from 'react';
import { useRef, memo } from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipeline-builder/types';
import { isTaskSearchable } from './pipeline-quicksearch-utils';
import PipelineQuickSearchPipelineDetails from './PipelineQuickSearchPipelineDetails';
import { CatalogServiceProvider } from '../catalog/service';
import { CatalogService } from '../catalog/types';
import { QuickSearchProviders } from './quick-search-types';
import { QuickSearchController } from '../quick-search';

interface PipelineQuickSearchPipelinesProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
}

const PipelineContents: FC<
  { catalogService: CatalogService } & PipelineQuickSearchPipelinesProps
> = ({
  catalogService,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const savedCallback = useRef(null);
  savedCallback.current = callback;

  const catalogServiceItems = catalogService.items.reduce((acc, item) => {
    item.cta.callback = () => {
      return new Promise((resolve) => {
        resolve(savedCallback.current(item.data));
      });
    };

    if (isTaskSearchable(catalogService.items, item)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'pipelinesPipelineCatalog',
      items: catalogServiceItems,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) =>
        `/search/ns/${ns}?keyword=${searchTerm}`,
      catalogLinkLabel: t('View all pipelines ({{itemCount, number}})'),
      extensions: catalogService.catalogExtensions,
    },
  ];

  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={catalogService.loaded}
      searchPlaceholder={`${t('Add')}...`}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
      callback={savedCallback.current}
      detailsRenderer={(props) => (
        <PipelineQuickSearchPipelineDetails {...props} />
      )}
    />
  );
};

const PipelineQuickSearchPipelines: FC<PipelineQuickSearchPipelinesProps> = (
  props,
) => {
  const { namespace } = props;
  return (
    <CatalogServiceProvider
      namespace={namespace}
      catalogId="pipelines-pipeline-catalog"
    >
      {(catalogService: CatalogService) => (
        <PipelineContents {...props} catalogService={catalogService} />
      )}
    </CatalogServiceProvider>
  );
};

export default memo(PipelineQuickSearchPipelines);
