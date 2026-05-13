import type { SetStateAction, Dispatch, ReactNode, FC } from 'react';
import { Content, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '@openshift-console/dynamic-plugin-sdk';
import CatalogBadges from '../catalog/CatalogBadges';
import { TaskSearchCallback } from '../pipeline-builder/types';

import './QuickSearchDetails.scss';

export type QuickSearchDetailsRendererProps = {
  selectedItem: CatalogItem;
  closeModal: () => void;
  namespace?: string;
  callback?: TaskSearchCallback;
  setFailedTasks?: Dispatch<SetStateAction<string[]>>;
  selectedVersion?: string;
  onVersionChange?: (version: string) => void;
};
export type DetailsRendererFunction = (
  props: QuickSearchDetailsRendererProps,
) => ReactNode;
export interface QuickSearchDetailsProps
  extends QuickSearchDetailsRendererProps {
  detailsRenderer: DetailsRendererFunction;
}

const QuickSearchDetails: FC<QuickSearchDetailsProps> = ({
  selectedItem,
  closeModal,
  detailsRenderer,
  namespace,
  callback,
  setFailedTasks,
  selectedVersion,
  onVersionChange,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const defaultContentRenderer: DetailsRendererFunction = (
    props: QuickSearchDetailsProps,
  ): ReactNode => {
    return (
      <>
        <Title headingLevel="h4">{props.selectedItem.name}</Title>
        {props.selectedItem.provider && (
          <span className="ocs-quick-search-details__provider">
            {t('Provided by {{provider}}', {
              provider: props.selectedItem.provider,
            })}
          </span>
        )}
        {selectedItem.badges?.length > 0 ? (
          <CatalogBadges badges={selectedItem.badges} />
        ) : undefined}
        <Content className="ocs-quick-search-details__description">
          {props.selectedItem.description}
        </Content>
      </>
    );
  };
  const detailsContentRenderer: DetailsRendererFunction =
    detailsRenderer ?? defaultContentRenderer;

  return (
    <div className="ocs-quick-search-details">
      {detailsContentRenderer({
        selectedItem,
        closeModal,
        namespace,
        callback,
        setFailedTasks,
        selectedVersion,
        onVersionChange,
      })}
    </div>
  );
};

export default QuickSearchDetails;
