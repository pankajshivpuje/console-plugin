import { type FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { RhUiAiExperienceIcon } from '@patternfly/react-icons';
import { useAiAssistant, type ChatMessage } from './AiAssistantContext';

import './AiAssistantSidebar.scss';

const SUMMARY_CARDS = [
  { key: 'pipelines', title: 'Pipelines summary' },
  { key: 'pipelineruns', title: 'PipelineRuns' },
  { key: 'tasks', title: 'Tasks' },
  { key: 'taskruns', title: 'Task Runs' },
];

const AiAssistantWelcome: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setIsOpen, addMessage, setIsLoading } = useAiAssistant();
  const [inputValue, setInputValue] = useState('');

  const handleQuickAction = useCallback(
    (action: string) => {
      setIsOpen(true);
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: action,
        timestamp: new Date(),
      };
      addMessage(userMsg);
      setIsLoading(true);

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: t(
            'I can help you with that! Let me set things up for you.',
          ),
          timestamp: new Date(),
        };
        addMessage(botMsg);
        setIsLoading(false);
      }, 1500);
    },
    [setIsOpen, addMessage, setIsLoading, t],
  );

  const handleSendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setIsOpen(true);
      setInputValue('');
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      addMessage(userMsg);
      setIsLoading(true);

      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'bot',
          content: t(
            'I can help you create and modify pipelines. Try asking me to "Create a new pipeline" or "Add an SBOM task".',
          ),
          timestamp: new Date(),
        };
        addMessage(botMsg);
        setIsLoading(false);
      }, 1500);
    },
    [setIsOpen, addMessage, setIsLoading, t],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(inputValue);
      }
    },
    [handleSendMessage, inputValue],
  );

  return (
    <div className="ai-assistant-welcome__section">
      <Title headingLevel="h3">
        {t('Welcome back. Here is the latest with your pipelines.')}
      </Title>

      <div className="ai-assistant-welcome__cards">
        {SUMMARY_CARDS.map((card) => (
          <Card key={card.key} className="ai-assistant-welcome__card" isCompact>
            <CardTitle>{t(card.title)}</CardTitle>
            <CardBody>
              <Content component={ContentVariants.small}>
                {t('<text goes here>')}
              </Content>
            </CardBody>
          </Card>
        ))}
      </div>

      <Title headingLevel="h4">{t('How may I help you today?')}</Title>

      <div className="ai-assistant-welcome__prompt">
        <Flex gap={{ default: 'gapSm' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <TextInput
              type="text"
              value={inputValue}
              onChange={(_e, val) => setInputValue(val)}
              onKeyDown={handleKeyDown}
              placeholder={t('Ask anything...')}
              aria-label={t('Message input')}
            />
          </FlexItem>
          <FlexItem>
            <Button
              variant="primary"
              isDisabled={!inputValue.trim()}
              onClick={() => handleSendMessage(inputValue)}
            >
              {t('Send')}
            </Button>
          </FlexItem>
        </Flex>
        <Content
          component={ContentVariants.small}
          className="pf-v6-u-mt-xs pf-v6-u-text-align-center"
        >
          {t('Bot uses AI. Check for mistakes.')}
        </Content>
      </div>

      <div className="ai-assistant-welcome__quick-actions">
        <Button
          variant="primary"
          icon={<RhUiAiExperienceIcon />}
          onClick={() => handleQuickAction(t('Summarize this view'))}
        >
          {t('Summarize this view')}
        </Button>
        <Button
          variant="primary"
          icon={<RhUiAiExperienceIcon />}
          onClick={() => handleQuickAction(t('Create new pipeline'))}
        >
          {t('Create new pipeline')}
        </Button>
        <Button
          variant="primary"
          icon={<RhUiAiExperienceIcon />}
          onClick={() => handleQuickAction(t('Create new task'))}
        >
          {t('Create new task')}
        </Button>
      </div>
    </div>
  );
};

export default AiAssistantWelcome;
