import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ClipboardCopyButton,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useState } from 'react';
import type { LocalQueue } from '../__demo__/mock-localqueue-data';
import { localQueueToYAML } from './localqueue-yaml';

const LocalQueueYAMLTab: FC<{ lq: LocalQueue }> = ({ lq }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [copied, setCopied] = useState(false);
  const yaml = localQueueToYAML(lq);

  const onCopy = () => {
    navigator.clipboard?.writeText(yaml);
    setCopied(true);
  };

  const actions = (
    <CodeBlockAction>
      <ClipboardCopyButton
        id="lq-yaml-copy"
        textId="lq-yaml"
        aria-label={t('Copy to clipboard')}
        onClick={onCopy}
        exitDelay={copied ? 1500 : 600}
        onTooltipHidden={() => setCopied(false)}
        variant="plain"
      >
        {copied ? t('Copied') : t('Copy to clipboard')}
      </ClipboardCopyButton>
    </CodeBlockAction>
  );

  return (
    <Stack hasGutter className="pf-v6-u-mt-md">
      <StackItem>
        <Alert
          variant="info"
          isInline
          isPlain
          title={t('This is a read-only preview of the generated LocalQueue manifest.')}
        />
      </StackItem>
      <StackItem>
        <CodeBlock actions={actions}>
          <CodeBlockCode id="lq-yaml">{yaml}</CodeBlockCode>
        </CodeBlock>
      </StackItem>
    </Stack>
  );
};

export default LocalQueueYAMLTab;
