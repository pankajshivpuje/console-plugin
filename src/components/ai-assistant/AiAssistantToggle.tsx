import { type FC, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip } from '@patternfly/react-core';
import { RhUiAiExperienceIcon } from '@patternfly/react-icons';
import { useAiAssistant } from './AiAssistantContext';

import './AiAssistantSidebar.scss';

const TOOLBAR_SELECTOR =
  '.pf-v6-c-masthead .pf-v6-c-toolbar__content > .pf-v6-c-toolbar__group.pf-m-align-end';

const AiAssistantToggle: FC = () => {
  const { toggleOpen } = useAiAssistant();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    const findAndPrepare = () => {
      const toolbarGroup = document.querySelector(TOOLBAR_SELECTOR);
      if (!toolbarGroup) return false;

      const existing = toolbarGroup.querySelector(
        '.ai-assistant-masthead-toggle',
      );
      if (existing) {
        setPortalContainer(existing as HTMLElement);
        return true;
      }

      const wrapper = document.createElement('div');
      wrapper.className =
        'pf-v6-c-toolbar__item ai-assistant-masthead-toggle';
      toolbarGroup.insertBefore(wrapper, toolbarGroup.firstChild);
      setPortalContainer(wrapper);
      return true;
    };

    if (findAndPrepare()) return;

    const observer = new MutationObserver(() => {
      if (findAndPrepare()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const button = (
    <Tooltip content="AI Assistant">
      <Button
        variant="plain"
        icon={<RhUiAiExperienceIcon />}
        onClick={toggleOpen}
        aria-label="AI Assistant"
      />
    </Tooltip>
  );

  if (portalContainer) {
    return createPortal(button, portalContainer);
  }

  return (
    <div className="ai-assistant-toggle">
      <Tooltip content="AI Assistant">
        <Button
          variant="primary"
          icon={<RhUiAiExperienceIcon />}
          onClick={toggleOpen}
          aria-label="AI Assistant"
          className="ai-assistant-toggle__button"
        />
      </Tooltip>
    </div>
  );
};

export default AiAssistantToggle;
