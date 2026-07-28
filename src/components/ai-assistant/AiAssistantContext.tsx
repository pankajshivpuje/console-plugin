import {
  createContext,
  useContext,
  useState,
  useCallback,
  type FC,
  type ReactNode,
} from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  toolCall?: {
    title: string;
    description: string;
    codeBlock?: string;
    status: 'pending' | 'running' | 'complete';
    result?: string;
  };
}

interface AiAssistantContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedAgent: string;
  setSelectedAgent: (agent: string) => void;
}

const AiAssistantContext = createContext<AiAssistantContextValue | undefined>(
  undefined,
);

export const useAiAssistant = (): AiAssistantContextValue => {
  const ctx = useContext(AiAssistantContext);
  if (!ctx) {
    throw new Error('useAiAssistant must be used within AiAssistantProvider');
  }
  return ctx;
};

export const AiAssistantProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('Pipelines agent');

  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return (
    <AiAssistantContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        messages,
        addMessage,
        clearMessages,
        isLoading,
        setIsLoading,
        selectedAgent,
        setSelectedAgent,
      }}
    >
      {children}
    </AiAssistantContext.Provider>
  );
};
