import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  FormSelect,
  FormSelectOption,
  Radio,
  Checkbox,
} from '@patternfly/react-core';
import type { LocalQueue, SchedulingPolicy } from '../__demo__/mock-localqueue-data';
import {
  SPOKE_CLUSTERS,
  NAMESPACE_OPTIONS,
  RESOURCE_FLAVOR_OPTIONS,
} from '../__demo__/mock-localqueue-data';

export interface LocalQueueFormValues {
  name: string;
  namespace: string;
  resourceFlavor: string;
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];
}

export interface LocalQueueModalProps {
  isOpen: boolean;
  editTarget: LocalQueue | null;
  onClose: () => void;
  onSubmit: (values: LocalQueueFormValues) => void;
}

const emptyValues: LocalQueueFormValues = {
  name: '',
  namespace: '',
  resourceFlavor: RESOURCE_FLAVOR_OPTIONS[0],
  schedulingPolicy: 'hub-only',
  spokeClusterNames: [],
};

const POLICIES: { value: SchedulingPolicy; label: string; desc: string }[] = [
  {
    value: 'hub-only',
    label: 'Hub Only',
    desc: 'PipelineRuns execute only on the hub cluster. Use for sensitive workloads or when spoke clusters are unavailable.',
  },
  {
    value: 'any-spoke',
    label: 'Any Spoke',
    desc: 'PipelineRuns are distributed to any available spoke cluster. Kueue selects the best fit based on resource availability.',
  },
  {
    value: 'selected-spokes',
    label: 'Selected Spokes',
    desc: 'PipelineRuns are restricted to a specific set of spoke clusters that you choose below.',
  },
];

const LocalQueueModal: FC<LocalQueueModalProps> = ({ isOpen, editTarget, onClose, onSubmit }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isEdit = editTarget !== null;
  const [values, setValues] = useState<LocalQueueFormValues>(emptyValues);

  useEffect(() => {
    if (editTarget) {
      setValues({
        name: editTarget.name,
        namespace: editTarget.namespace,
        resourceFlavor: editTarget.resourceFlavor,
        schedulingPolicy: editTarget.schedulingPolicy,
        spokeClusterNames: [...editTarget.spokeClusterNames],
      });
    } else {
      setValues(emptyValues);
    }
  }, [editTarget, isOpen]);

  const set = <K extends keyof LocalQueueFormValues>(key: K, val: LocalQueueFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const toggleSpoke = (name: string, checked: boolean) =>
    set(
      'spokeClusterNames',
      checked
        ? [...values.spokeClusterNames, name]
        : values.spokeClusterNames.filter((s) => s !== name),
    );

  const canSubmit = values.name.trim() !== '' && values.namespace !== '';

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={isEdit ? t('Edit LocalQueue') : t('Create LocalQueue')} />
      <ModalBody>
        <Form id="localqueue-form">
          <FormGroup label={t('Name')} isRequired fieldId="lq-name">
            <TextInput
              id="lq-name"
              isRequired
              isDisabled={isEdit}
              value={values.name}
              onChange={(_e, v) => set('name', v)}
              placeholder="e.g. ci-builds-fast"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Must be a valid Kubernetes resource name (lowercase, alphanumeric, dashes).')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Namespace')} isRequired fieldId="lq-namespace">
            <FormSelect
              id="lq-namespace"
              value={values.namespace}
              onChange={(_e, v) => set('namespace', v)}
              aria-label={t('Namespace')}
            >
              <FormSelectOption value="" label={t('Select namespace...')} isDisabled />
              {NAMESPACE_OPTIONS.map((ns) => (
                <FormSelectOption key={ns} value={ns} label={ns} />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label={t('Resource Flavor')} isRequired fieldId="lq-flavor">
            <FormSelect
              id="lq-flavor"
              value={values.resourceFlavor}
              onChange={(_e, v) => set('resourceFlavor', v)}
              aria-label={t('Resource Flavor')}
            >
              {RESOURCE_FLAVOR_OPTIONS.map((f) => (
                <FormSelectOption key={f} value={f} label={f} />
              ))}
            </FormSelect>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Kueue ResourceFlavor for resource quota allocation.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup
            label={t('Scheduling Policy')}
            isRequired
            fieldId="lq-policy"
            role="radiogroup"
          >
            {POLICIES.map((p) => (
              <Radio
                key={p.value}
                id={`lq-policy-${p.value}`}
                name="lq-policy"
                label={t(p.label)}
                description={t(p.desc)}
                isChecked={values.schedulingPolicy === p.value}
                onChange={() => set('schedulingPolicy', p.value)}
              />
            ))}
          </FormGroup>

          {values.schedulingPolicy === 'selected-spokes' && (
            <FormGroup label={t('Select Spoke Clusters')} fieldId="lq-spokes">
              {SPOKE_CLUSTERS.map((sc) => (
                <Checkbox
                  key={sc.name}
                  id={`lq-spoke-${sc.name}`}
                  label={`${sc.name} (${sc.region})`}
                  isChecked={values.spokeClusterNames.includes(sc.name)}
                  onChange={(_e, checked) => toggleSpoke(sc.name, checked)}
                />
              ))}
            </FormGroup>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          isDisabled={!canSubmit}
          onClick={() => onSubmit(values)}
        >
          {isEdit ? t('Save') : t('Create')}
        </Button>
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default LocalQueueModal;
