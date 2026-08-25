import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  LabelGroup,
  MenuToggle,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon, SyncAltIcon, DownloadIcon } from '@patternfly/react-icons';
import {
  ALL_SPOKES,
  LAST_UPDATED_LABEL,
  TIME_RANGE_OPTIONS,
  SpokeName,
} from '../../__demo__/mock-fleet-data';
import type { FleetFilterState } from './types';

interface FleetToolbarProps {
  filter: FleetFilterState;
  onChange: (next: FleetFilterState) => void;
}

const FleetToolbar: FC<FleetToolbarProps> = ({ filter, onChange }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [spokeOpen, setSpokeOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const removeSpoke = (spoke: SpokeName) =>
    onChange({
      ...filter,
      selectedSpokes: filter.selectedSpokes.filter((s) => s !== spoke),
    });

  const toggleSpoke = (spoke: SpokeName) =>
    onChange({
      ...filter,
      selectedSpokes: filter.selectedSpokes.includes(spoke)
        ? filter.selectedSpokes.filter((s) => s !== spoke)
        : [...filter.selectedSpokes, spoke],
    });

  return (
    <Toolbar className="pf-v6-u-pb-0">
      <ToolbarContent>
        <ToolbarItem>
          <Button variant="secondary" icon={<FilterIcon />}>
            {t('Filter')}
          </Button>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            isOpen={spokeOpen}
            onOpenChange={setSpokeOpen}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setSpokeOpen((o) => !o)}
                isExpanded={spokeOpen}
              >
                {t('All Spoke Clusters')} ({filter.selectedSpokes.length})
              </MenuToggle>
            )}
          >
            <DropdownList>
              {ALL_SPOKES.map((s) => (
                <DropdownItem
                  key={s}
                  onClick={() => toggleSpoke(s)}
                  isSelected={filter.selectedSpokes.includes(s)}
                >
                  {s}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            isOpen={timeOpen}
            onOpenChange={setTimeOpen}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setTimeOpen((o) => !o)}
                isExpanded={timeOpen}
              >
                {filter.timeRange}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {TIME_RANGE_OPTIONS.map((tr) => (
                <DropdownItem
                  key={tr}
                  onClick={() => {
                    onChange({ ...filter, timeRange: tr });
                    setTimeOpen(false);
                  }}
                >
                  {tr}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </ToolbarItem>
        <ToolbarItem>
          <SearchInput
            placeholder={t('Search by pipeline name...')}
            value={filter.search}
            onChange={(_e, v) => onChange({ ...filter, search: v })}
            onClear={() => onChange({ ...filter, search: '' })}
          />
        </ToolbarItem>
        <ToolbarItem>
          <LabelGroup numLabels={ALL_SPOKES.length}>
            {filter.selectedSpokes.map((s) => (
              <Label
                key={s}
                color="blue"
                onClose={() => removeSpoke(s)}
                closeBtnAriaLabel={`${t('Close')} ${s}`}
              >
                {s}
              </Label>
            ))}
          </LabelGroup>
        </ToolbarItem>
        <ToolbarItem align={{ default: 'alignEnd' }}>
          <span className="pf-v6-u-color-200 pf-v6-u-mr-sm">
            {t('Updated')} {LAST_UPDATED_LABEL}
          </span>
          <Button variant="plain" aria-label={t('Refresh')} icon={<SyncAltIcon />} />
          <Button variant="plain" aria-label={t('Download')} icon={<DownloadIcon />} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default FleetToolbar;
