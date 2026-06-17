import type { FC } from 'react';
import { useMemo } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceKind,
  RedExclamationCircleIcon,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useField, useFormikContext, FormikValues } from 'formik';
import cx from 'classnames';
import { PersistentVolumeClaimModel } from '../../models';
import ResourceDropdown from './ResourceDropdown';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { getFieldId } from '../pipelines-details/multi-column-field/utils';
import { useFormikValidationFix } from '../pipelines-details/multi-column-field/formik-validation-fix';
import './PVCDropdown.scss';

const MOCK_PVC_NAMES = [
  'default',
  'hostpath-provisioner',
  'kube-node-lease',
  'kube-public',
  'kube-system',
  'mynewproject',
];

const createMockPVC = (name: string, namespace: string): K8sResourceKind => ({
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name,
    namespace,
    uid: `mock-pvc-${name}`,
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: { requests: { storage: '1Gi' } },
  },
});

interface PVCDropdownProps {
  name: string;
}

const PVCDropdown: FC<PVCDropdownProps> = ({ name }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [field, { touched, error }] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fieldId = getFieldId(name, 'ns-dropdown');
  const isValid = !(touched && error);
  const errorMessage = !isValid ? error : '';

  useFormikValidationFix(field.value);
  const [namespace] = useActiveNamespace();
  const autocompleteFilter = (strText, item): boolean =>
    fuzzy(strText, item?.props?.name);
  const resource = {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    optional: true,
  };
  const [clusterResources, clusterLoaded, loadError] =
    useK8sWatchResource(resource);

  const mockPVCs = useMemo(
    () => MOCK_PVC_NAMES.map((n) => createMockPVC(n, namespace)),
    [namespace],
  );

  const hasClusterData =
    clusterLoaded &&
    !loadError &&
    Array.isArray(clusterResources) &&
    clusterResources.length > 0;
  const resources = hasClusterData
    ? (clusterResources as K8sResourceKind[])
    : mockPVCs;
  const loaded = hasClusterData ? clusterLoaded : true;

  return (
    <>
      <FormGroup fieldId={fieldId} isRequired data-test="pvc-dropdown">
        <ResourceDropdown
          resources={[
            {
              kind: PersistentVolumeClaimModel.kind,
              loaded,
              loadError: hasClusterData ? loadError : undefined,
              data: resources,
            },
          ]}
          loaded={loaded}
          loadError={hasClusterData ? loadError : undefined}
          dataSelector={['metadata', 'name']}
          selectedKey={field.value}
          placeholder={t('Select a PVC')}
          autocompleteFilter={autocompleteFilter}
          dropDownClassName={cx({ 'dropdown--full-width': true })}
          onChange={(value: string) => {
            setFieldValue(name, value);
            setFieldTouched(name, true);
          }}
          showBadge
        />
        <FormHelperText>
          <HelperText>
            {!isValid && (
              <HelperTextItem
                variant="error"
                icon={<RedExclamationCircleIcon />}
              >
                {errorMessage}
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </>
  );
};

export default PVCDropdown;
