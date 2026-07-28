import { type FC, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  Button,
  Content,
  ContentVariants,
  Dropdown,
  DropdownItem,
  DropdownList,
  ExpandableSection,
  Flex,
  FlexItem,
  MenuToggle,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import { useAiAssistant, type ChatMessage } from './AiAssistantContext';
import { MOCK_PIPELINE_YAML, MOCK_SBOM_TASK_YAML } from './mock-pipeline-yaml';

import './AiAssistantSidebar.scss';

const AGENTS = ['Pipelines agent', 'Agent 1', 'General assistant'];

const AiAssistantSidebar: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const {
    isOpen,
    setIsOpen,
    messages,
    addMessage,
    isLoading,
    setIsLoading,
    selectedAgent,
    setSelectedAgent,
  } = useAiAssistant();

  const [toolCallStatuses, setToolCallStatuses] = useState<
    Record<string, 'pending' | 'applied' | 'kept'>
  >({});
  const [inputValue, setInputValue] = useState('');
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };
      addMessage(userMsg);
      setIsLoading(true);
      setInputValue('');

      const lowerText = trimmed.toLowerCase();

      if (lowerText.includes('create') && lowerText.includes('pipeline')) {
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: '',
            timestamp: new Date(),
            toolCall: {
              title: t('Create pipeline'),
              description: t('Executing command to update the YAML.'),
              codeBlock: MOCK_PIPELINE_YAML,
              status: 'complete',
              result: t('Updated the YAML file for creating new pipeline'),
            },
          };
          addMessage(botMsg);
          setIsLoading(false);
          setToolCallStatuses((prev) => ({
            ...prev,
            [botMsg.id]: 'pending',
          }));
        }, 2500);
      } else if (
        lowerText.includes('sbom') ||
        (lowerText.includes('add') && lowerText.includes('task'))
      ) {
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: '',
            timestamp: new Date(),
            toolCall: {
              title: t('Add SBOM task'),
              description: t('Executing command to update the YAML.'),
              codeBlock: MOCK_SBOM_TASK_YAML,
              status: 'complete',
              result: t('Added SBOM generation task to the pipeline'),
            },
          };
          addMessage(botMsg);
          setIsLoading(false);
          setToolCallStatuses((prev) => ({
            ...prev,
            [botMsg.id]: 'pending',
          }));
        }, 2000);
      } else {
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
      }
    },
    [addMessage, setIsLoading, t],
  );

  const handleToolCallAction = useCallback(
    (msgId: string, action: 'apply' | 'keep' | 'undo') => {
      if (action === 'apply') {
        setToolCallStatuses((prev) => ({ ...prev, [msgId]: 'applied' }));
        navigate(
          '/k8s/ns/openshift-pipelines/tekton.dev~v1~Pipeline/~new/builder',
        );
      } else if (action === 'keep') {
        setToolCallStatuses((prev) => ({ ...prev, [msgId]: 'kept' }));
      } else {
        setToolCallStatuses((prev) => {
          const next = { ...prev };
          delete next[msgId];
          return next;
        });
      }
    },
    [navigate],
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

  if (!isOpen) return null;

  return (
    <div className="ai-sidebar">
      <div className="ai-sidebar__header">
        <Title headingLevel="h3" className="ai-sidebar__title">
          {t('Create with AI')}
        </Title>
        <Flex
          gap={{ default: 'gapSm' }}
          alignItems={{ default: 'alignItemsCenter' }}
        >
          <FlexItem>
            <Dropdown
              isOpen={isAgentDropdownOpen}
              onSelect={() => setIsAgentDropdownOpen(false)}
              onOpenChange={setIsAgentDropdownOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsAgentDropdownOpen((prev) => !prev)}
                  isExpanded={isAgentDropdownOpen}
                  variant="plainText"
                >
                  {selectedAgent}
                </MenuToggle>
              )}
            >
              <DropdownList>
                {AGENTS.map((agent) => (
                  <DropdownItem
                    key={agent}
                    isSelected={agent === selectedAgent}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    {agent}
                  </DropdownItem>
                ))}
              </DropdownList>
            </Dropdown>
          </FlexItem>
          <FlexItem>
            <Button
              variant="plain"
              aria-label={t('Close')}
              icon={<TimesIcon />}
              onClick={() => setIsOpen(false)}
            />
          </FlexItem>
        </Flex>
      </div>

      <div className="ai-sidebar__content">
        <div className="ai-assistant__messages">
          {messages.map((msg) => {
            if (msg.toolCall) {
              const status = toolCallStatuses[msg.id] || 'pending';
              return (
                <div
                  key={msg.id}
                  className="ai-assistant__message ai-assistant__message--bot"
                >
                  <Content
                    component={ContentVariants.small}
                    className="ai-assistant__message-meta"
                  >
                    {selectedAgent} &middot;{' '}
                    {msg.timestamp.toLocaleTimeString()}
                  </Content>
                  {msg.toolCall.result && (
                    <Content component={ContentVariants.p}>
                      {msg.toolCall.result}
                    </Content>
                  )}
                  <div className="ai-assistant__tool-call">
                    <Content component={ContentVariants.h5}>
                      {msg.toolCall.title}
                    </Content>
                    {msg.toolCall.codeBlock && (
                      <ExpandableSection
                        toggleText={t('View YAML')}
                        isIndented
                      >
                        <pre className="ai-assistant__code-block">
                          <code>{msg.toolCall.codeBlock}</code>
                        </pre>
                      </ExpandableSection>
                    )}
                    <Flex
                      className="pf-v6-u-mt-sm"
                      gap={{ default: 'gapSm' }}
                    >
                      <FlexItem>
                        <Button
                          variant="primary"
                          size="sm"
                          isDisabled={status !== 'pending'}
                          onClick={() =>
                            handleToolCallAction(msg.id, 'apply')
                          }
                        >
                          {status === 'applied' ? t('Applied') : t('Apply')}
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          isDisabled={status !== 'pending'}
                          onClick={() =>
                            handleToolCallAction(msg.id, 'keep')
                          }
                        >
                          {t('Keep')}
                        </Button>
                      </FlexItem>
                    </Flex>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`ai-assistant__message ai-assistant__message--${msg.role}`}
              >
                <Content
                  component={ContentVariants.small}
                  className="ai-assistant__message-meta"
                >
                  {msg.role === 'user' ? t('You') : selectedAgent} &middot;{' '}
                  {msg.timestamp.toLocaleTimeString()}
                </Content>
                <Content component={ContentVariants.p}>{msg.content}</Content>
              </div>
            );
          })}
          {isLoading && (
            <div className="ai-assistant__message ai-assistant__message--bot">
              <Content
                component={ContentVariants.small}
                className="ai-assistant__message-meta"
              >
                {selectedAgent}
              </Content>
              <Content
                component={ContentVariants.p}
                className="ai-assistant__loading"
              >
                {t('Thinking...')}
              </Content>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="ai-sidebar__footer">
        <Flex gap={{ default: 'gapSm' }} className="ai-assistant__input-bar">
          <FlexItem grow={{ default: 'grow' }}>
            <TextInput
              type="text"
              value={inputValue}
              onChange={(_e, val) => setInputValue(val)}
              onKeyDown={handleKeyDown}
              placeholder={t('Follow up...')}
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
        <span className="ai-assistant__footnote">
          {t('Bot uses AI. Check for mistakes.')}
        </span>
      </div>
    </div>
  );
};

export default AiAssistantSidebar;
