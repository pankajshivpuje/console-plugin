import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MenuToggle,
  Select,
  SelectList,
  SelectOption,
} from '@patternfly/react-core';
import { ClusterInfo } from '../../types';

type ClusterDropdownProps = {
  clusters: ClusterInfo[];
  selected: string;
  onSelect: (value: string) => void;
};

const ClusterDropdown: FC<ClusterDropdownProps> = ({
  clusters,
  selected,
  onSelect,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel =
    selected === 'all'
      ? t('All Clusters')
      : clusters.find((c) => c.name === selected)?.name || selected;

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onSelect={(_e, value) => {
        onSelect(value as string);
        setIsOpen(false);
      }}
      selected={selected}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
        >
          {selectedLabel}
        </MenuToggle>
      )}
    >
      <SelectList>
        <SelectOption value="all">{t('All Clusters')}</SelectOption>
        {clusters.map((cluster) => (
          <SelectOption key={cluster.name} value={cluster.name}>
            {cluster.name}
            {cluster.status === 'NotReady' && ` (${t('Not Ready')})`}
          </SelectOption>
        ))}
      </SelectList>
    </Select>
  );
};

export default ClusterDropdown;
