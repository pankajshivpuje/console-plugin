import type { FC } from 'react';
import classNames from 'classnames';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import PipelineResourceRef from './PipelineResourceRef';

import './DynamicResourceLinkList.scss';

export type ResourceModelLink = {
  resourceKind: string;
  name: string;
  qualifier?: string;
  disableLink?: boolean;
  namespace?: string;
  resourceApiVersion?: string;
  badge?: {
    text: string;
    color: string;
  };
};

type DynamicResourceLinkListProps = {
  links: ResourceModelLink[];
  namespace: string;
  title?: string;
  removeSpaceBelow?: boolean;
};

const DynamicResourceLinkList: FC<DynamicResourceLinkListProps> = ({
  links = [],
  namespace,
  title,
  removeSpaceBelow,
}) => {
  if (links.length === 0) {
    return null;
  }
  return (
    <div
      className={classNames('odc-dynamic-resource-link-list', {
        'odc-dynamic-resource-link-list--addSpaceBelow': !removeSpaceBelow,
      })}
    >
      <DescriptionList>
        <DescriptionListGroup>
          {title && <DescriptionListTerm>{title}</DescriptionListTerm>}
          <DescriptionListDescription>
            {links.map(
              ({
                name,
                resourceKind,
                qualifier = '',
                disableLink = false,
                namespace: namespaceForTask,
                resourceApiVersion,
                badge,
              }) => {
                let linkName = qualifier;
                if (qualifier?.length > 0 && name !== qualifier) {
                  linkName += ` (${name})`;
                }
                return (
                  <div
                    key={`${resourceKind}/${linkName}`}
                    className="odc-dynamic-resource-link-list__item"
                  >
                    {badge && (
                      <span
                        className="odc-dynamic-resource-link-list__badge"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.text}
                      </span>
                    )}
                    <PipelineResourceRef
                      resourceKind={resourceKind}
                      resourceName={name}
                      displayName={linkName}
                      namespace={namespaceForTask || namespace}
                      disableLink={disableLink}
                      resourceApiVersion={resourceApiVersion}
                      hideIcon={!!badge}
                    />
                  </div>
                );
              },
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};

export default DynamicResourceLinkList;
