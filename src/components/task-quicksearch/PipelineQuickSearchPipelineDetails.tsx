import type { FC } from 'react';
import { useState } from 'react';
import {
  Button,
  ButtonVariant,
  Label,
  LabelGroup,
  Level,
  LevelItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Content,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  getCtaButtonText,
  isOneVersionInstalled,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchVersionDropdown from './PipelineQuickSearchVersionDropdown';
import { handleCta } from '../quick-search';
import { QuickSearchDetailsRendererProps } from '../quick-search/QuickSearchDetails';

import './PipelineQuickSearchDetails.scss';

const PipelineQuickSearchPipelineDetails: FC<
  QuickSearchDetailsRendererProps
> = ({ selectedItem, closeModal, namespace, callback, setFailedTasks }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState<string>(
    selectedItem?.attributes?.installed ?? '',
  );
  const versions = selectedItem?.attributes?.versions ?? [];
  const hasInstalledVersion = isOneVersionInstalled(selectedItem);

  const taskCount = selectedItem?.data?.spec?.tasks?.length ?? 0;
  const workspaceCount = selectedItem?.data?.spec?.workspaces?.length ?? 0;

  return (
    <div className="opp-quick-search-details">
      <Level hasGutter>
        <LevelItem>
          <Title data-test="pipeline-name" headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test="pipeline-provider">{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Level hasGutter>
        <LevelItem>
          <Split hasGutter>
            <SplitItem>
              <Button
                data-test="pipeline-cta"
                variant={ButtonVariant.primary}
                className="opp-quick-search-details__form-button"
                onClick={(e) => {
                  handleCta(e, selectedItem, closeModal, navigate, {
                    selectedVersion,
                    selectedItem,
                    isDevConsoleProxyAvailable: false,
                    namespace,
                    callback,
                    setFailedTasks,
                  });
                }}
              >
                {getCtaButtonText(selectedItem, selectedVersion)}
              </Button>
            </SplitItem>
            {versions.length > 0 && (
              <SplitItem data-test="pipeline-version-dropdown">
                <PipelineQuickSearchVersionDropdown
                  key={selectedItem.uid}
                  versions={versions}
                  item={selectedItem}
                  selectedVersion={selectedVersion}
                  onChange={setSelectedVersion}
                />
              </SplitItem>
            )}
          </Split>
        </LevelItem>
        {hasInstalledVersion && (
          <LevelItem>
            <Label
              color="green"
              icon={<CheckCircleIcon />}
              data-test="pipeline-installed-badge"
            >
              {t('Installed')}
            </Label>
          </LevelItem>
        )}
      </Level>
      <Content
        className="opp-quick-search-details__description"
        data-test="pipeline-description"
      >
        {selectedItem.description}
      </Content>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <Label color="blue">
                {t('{{count}} tasks', { count: taskCount })}
              </Label>
            </SplitItem>
            <SplitItem>
              <Label color="blue">
                {t('{{count}} workspaces', { count: workspaceCount })}
              </Label>
            </SplitItem>
          </Split>
        </StackItem>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('Categories')}
              data-test="pipeline-category-list"
            >
              {selectedItem.attributes.categories.map((category) => (
                <Label color="blue" key={category}>
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('Tags')} data-test="pipeline-tag-list">
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag}>
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
      </Stack>
    </div>
  );
};

export default PipelineQuickSearchPipelineDetails;
