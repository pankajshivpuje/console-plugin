import type { FC } from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Label,
  LabelGroup,
  Level,
  LevelItem,
  SplitItem,
  Stack,
  StackItem,
  Content,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { getArtifactHubTaskDetails } from '../catalog/apis/artifactHub';
import {
  getTaskCtaType,
  isArtifactHubTask,
  isOneVersionInstalled,
  isTaskVersionInstalled,
  isTektonHubTaskWithoutVersions,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchTaskAlert from './PipelineQuickSearchTaskAlert';
import PipelineQuickSearchVersionDropdown from './PipelineQuickSearchVersionDropdown';
import {
  getHubUIPath,
  getTektonHubTaskVersions,
} from '../catalog/apis/tektonHub';
import { ExternalLink } from '../utils/link';
import { QuickSearchDetailsRendererProps } from '../quick-search/QuickSearchDetails';
import { FLAGS } from '../../types';

import './PipelineQuickSearchDetails.scss';

const PipelineQuickSearchDetails: FC<QuickSearchDetailsRendererProps> = ({
  selectedItem,
  namespace,
  selectedVersion: controlledVersion,
  onVersionChange,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const [versions, setVersions] = useState(
    selectedItem?.attributes?.versions ?? [],
  );
  const [hasInstalledVersion, setHasInstalledVersion] = useState<boolean>(
    isOneVersionInstalled(selectedItem),
  );
  const resetVersions = useCallback(() => {
    setVersions(selectedItem?.attributes?.versions ?? []);
    onVersionChange?.(selectedItem?.attributes?.installed ?? '');
    setHasInstalledVersion(isOneVersionInstalled(selectedItem));
  }, [selectedItem, onVersionChange]);

  const onChangeVersion = useCallback(
    (key) => {
      onVersionChange?.(key);
      if (isArtifactHubTask(selectedItem)) {
        getArtifactHubTaskDetails(selectedItem, key, isDevConsoleProxyAvailable)
          .then((item) => {
            selectedItem.attributes.versions = item.available_versions;
            selectedItem.attributes.selectedVersionContentUrl =
              item.content_url;
            selectedItem.tags = item.keywords;

            setVersions([...item.available_versions]);
            setHasInstalledVersion(isOneVersionInstalled(selectedItem));
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Error while getting ArtifactHub Task details:', err);
            resetVersions();
          });
      }
    },
    [resetVersions, selectedItem, onVersionChange],
  );

  useEffect(() => {
    resetVersions();
    const mounted = true;
    if (
      isTektonHubTaskWithoutVersions(selectedItem) &&
      !isArtifactHubTask(selectedItem)
    ) {
      const debouncedLoadVersions = debounce(async () => {
        if (mounted) {
          try {
            const itemVersions = await getTektonHubTaskVersions(
              selectedItem?.data?.id,
              selectedItem?.attributes?.apiURL,
            );

            selectedItem.attributes.versions = itemVersions;

            if (mounted) {
              setVersions([...itemVersions]);
              setHasInstalledVersion(isOneVersionInstalled(selectedItem));
            }
          } catch (err) {
            if (mounted) {
              resetVersions();
            }
            console.log('failed to fetch versions:', err); // eslint-disable-line no-console
          }
        }
      }, 10);
      debouncedLoadVersions();
    }

    if (isArtifactHubTask(selectedItem)) {
      const debouncedLoadDetails = debounce(async () => {
        if (mounted) {
          try {
            const item = await getArtifactHubTaskDetails(
              selectedItem,
              undefined,
              isDevConsoleProxyAvailable,
            );
            selectedItem.attributes.versions = item.available_versions;
            selectedItem.attributes.selectedVersionContentUrl =
              item.content_url;
            selectedItem.tags = item.keywords;
            if (mounted) {
              setVersions([...item.available_versions]);
              setHasInstalledVersion(isOneVersionInstalled(selectedItem));
            }
          } catch (err) {
            if (mounted) {
              resetVersions();
            }
          }
        }
      }, 10);
      debouncedLoadDetails();
    }

    // return () => (mounted = false);
  }, [resetVersions, selectedItem]);

  useEffect(() => {
    if (isTaskVersionInstalled(selectedItem)) {
      onVersionChange?.(selectedItem.attributes.installed);
    } else {
      onVersionChange?.(
        selectedItem.data?.latestVersion?.version?.toString() ||
          selectedItem.data?.task?.version?.toString(),
      );
    }
  }, [selectedItem, onVersionChange]);

  const loadedVersion = useMemo(
    () =>
      versions?.find(
        (version) => version.version?.toString() === controlledVersion,
      ),
    [controlledVersion, versions],
  );

  const hubLink = getHubUIPath(
    loadedVersion?.hubURLPath,
    selectedItem.attributes.uiURL,
  );
  return (
    <div className="opp-quick-search-details">
      <Level hasGutter>
        <LevelItem>
          <Title data-test="task-name" headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test="task-provider">{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Level hasGutter>
        <LevelItem>
          {versions.length > 0 && (
            <SplitItem data-test="task-version-dropdown">
              <PipelineQuickSearchVersionDropdown
                key={selectedItem.uid}
                versions={versions}
                item={selectedItem}
                selectedVersion={controlledVersion}
                onChange={onChangeVersion}
              />
            </SplitItem>
          )}
        </LevelItem>
        {hasInstalledVersion && (
          <LevelItem>
            <Label
              color="green"
              icon={<CheckCircleIcon />}
              data-test="task-installed-badge"
            >
              {t('Installed')}
            </Label>
          </LevelItem>
        )}
      </Level>
      {
        <PipelineQuickSearchTaskAlert
          ctaType={getTaskCtaType(selectedItem, controlledVersion)}
        />
      }
      <Content
        className="opp-quick-search-details__description"
        data-test="task-description"
      >
        {selectedItem.description}
        {hubLink && (
          <ExternalLink
            additionalClassName="opp-quick-search-details__hublink"
            dataTestID="task-hub-link"
            href={hubLink}
            text={t('Read more')}
          />
        )}
      </Content>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('Categories')}
              data-test="task-category-list"
            >
              {selectedItem?.attributes?.categories.map((category) => (
                <Label
                  color="blue"
                  key={category}
                  data-test="task-category-list-item"
                >
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('Tags')} data-test="task-tag-list">
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag} data-test="task-tag-list-item">
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

export default PipelineQuickSearchDetails;
