import type { ReactNode, SetStateAction, Dispatch, FC } from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchModalBody, { FooterRenderer } from './QuickSearchModalBody';
import { QuickSearchData } from './utils/quick-search-types';
import './QuickSearchModal.scss';
import { useBoundingClientRect } from './useBoundingClientRect';
import { TaskSearchCallback } from '../pipeline-builder/types';

interface QuickSearchModalProps {
  isOpen: boolean;
  namespace: string;
  closeModal: () => void;
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  viewContainer?: HTMLElement;
  limitItemCount?: number;
  icon?: ReactNode;
  headerContent?: ReactNode;
  itemFilter?: (item: CatalogItem) => boolean;
  detailsRenderer?: DetailsRendererFunction;
  callback?: TaskSearchCallback;
  setFailedTasks?: Dispatch<SetStateAction<string[]>>;
  title?: string;
  footerRenderer?: FooterRenderer;
}

const QuickSearchModal: FC<QuickSearchModalProps> = ({
  isOpen,
  namespace,
  closeModal,
  searchCatalog,
  searchPlaceholder,
  allCatalogItemsLoaded,
  viewContainer,
  icon,
  headerContent,
  itemFilter,
  limitItemCount,
  detailsRenderer,
  callback,
  setFailedTasks,
  title,
  footerRenderer,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const clientRect = useBoundingClientRect(viewContainer);
  const maxHeight = clientRect?.height;
  const maxWidth = clientRect?.width;

  return viewContainer ? (
    <Modal
      className="pipelines-ocs-quick-search-modal"
      variant={ModalVariant.medium}
      aria-label={t('Quick search')}
      isOpen={isOpen}
      position="top"
      positionOffset="15%"
      appendTo={viewContainer}
    >
      <QuickSearchModalBody
        allCatalogItemsLoaded={allCatalogItemsLoaded}
        searchCatalog={searchCatalog}
        searchPlaceholder={searchPlaceholder}
        namespace={namespace}
        closeModal={closeModal}
        limitItemCount={limitItemCount}
        icon={icon}
        headerContent={headerContent}
        itemFilter={itemFilter}
        detailsRenderer={detailsRenderer}
        maxDimension={{ maxHeight, maxWidth }}
        viewContainer={viewContainer}
        callback={callback}
        setFailedTasks={setFailedTasks}
        title={title}
        footerRenderer={footerRenderer}
      />
    </Modal>
  ) : null;
};

export default QuickSearchModal;
