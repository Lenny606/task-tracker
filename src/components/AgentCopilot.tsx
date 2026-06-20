import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Trash2, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  ExternalLink,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

interface ToolCall {
  name: string;
  arguments: any;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  isExecuting?: boolean;
  isCompleted?: boolean;
  isError?: boolean;
}

const QUICK_SUGGESTIONS = [
  { label: 'Summarize today', text: "Summarize today's tasks and time tracked." },
  { label: 'Show my tasks', text: 'Show all my local tasks for today.' },
  { label: 'Find JIRA issues', text: 'Search for active JIRA issues in my project.' },
  { label: 'Log 1 hour to JIRA', text: 'Log 1 hour (3600 seconds) to a JIRA ticket.' },
];

const formatToolName = (name: string) => {
  return name
    .replace('tracker_', 'Local Tracker: ')
    .replace('task_', 'Tasks: ')
    .replace('jira_', 'JIRA: ')
    .replace(/_/g, ' ');
};

interface CopilotHeaderProps {
  hasMessages: boolean;
  onClearHistory: () => void;
  onClose: () => void;
}

const CopilotHeader: React.FC<CopilotHeaderProps> = ({ hasMessages, onClearHistory, onClose }) => {
  return (
    <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
      <div className="flex items-center gap-2.5">
        <div className="w-8.5 h-8.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 leading-none">
            TimeTrack Copilot
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Agentic Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            onClick={onClearHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all"
            title="Clear history"
          >
            <Trash2 size={16} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

interface CopilotSuggestionsProps {
  onSelectSuggestion: (text: string) => void;
}

const CopilotSuggestions: React.FC<CopilotSuggestionsProps> = ({ onSelectSuggestion }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-4">
      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500/80 mb-3">
        <MessageSquare size={20} />
      </div>
      <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
        How can I help you today?
      </h4>
      <p className="text-[11px] text-slate-400 max-w-[200px] mb-4">
        Ask me to summarize tasks, search issues, or log work to JIRA.
      </p>

      <div className="w-full space-y-1.5">
        {QUICK_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(s.text)}
            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-500/20 dark:border-slate-800/40 dark:hover:border-indigo-500/30 bg-slate-50/50 hover:bg-indigo-50/30 dark:bg-slate-800/20 dark:hover:bg-indigo-950/20 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-between"
          >
            {s.label}
            <ChevronRight size={12} className="opacity-60" />
          </button>
        ))}
      </div>
    </div>
  )
}

interface CopilotMessageThreadProps {
  messages: ChatMessage[];
  streamingText: string;
  activeTools: { name: string; args?: any }[];
  isLoading: boolean;
  onSelectSuggestion: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  threadContainerRef: React.RefObject<HTMLDivElement | null>;
}

const CopilotMessageThread: React.FC<CopilotMessageThreadProps> = ({
  messages,
  streamingText,
  activeTools,
  isLoading,
  onSelectSuggestion,
  messagesEndRef,
  threadContainerRef
}) => {
  if (messages.length === 0 && !streamingText && activeTools.length === 0) {
    return <CopilotSuggestions onSelectSuggestion={onSelectSuggestion} />
  }

  return (
    <div 
      ref={threadContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
    >
      {messages.map((msg, idx) => {
        if (msg.role === 'tool') {
          const isErr = msg.isError;
          return (
            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/50 rounded-2xl text-[10px] font-bold text-slate-500 dark:text-slate-400 animate-in fade-in duration-200">
              {isErr ? (
                <AlertCircle size={12} className="text-rose-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
              )}
              <span className="truncate">
                {formatToolName(msg.name || '')}
              </span>
              {isErr && <span className="text-rose-400 font-medium">Failed</span>}
              {!isErr && <span className="text-emerald-400 font-medium">Success</span>}
            </div>
          );
        }

        const isUser = msg.role === 'user';
        return (
          <div
            key={idx}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                isUser
                  ? 'bg-indigo-600 text-white font-medium shadow-md rounded-br-sm'
                  : msg.isError
                  ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-bl-sm font-medium'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm leading-relaxed'
              }`}
            >
              {msg.content}
            </div>
          </div>
        );
      })}

      {activeTools.map((t, idx) => (
        <div 
          key={idx}
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse"
        >
          <Loader2 size={12} className="animate-spin flex-shrink-0" />
          <span className="truncate flex-1">
            Executing: {formatToolName(t.name)}
          </span>
          <Database size={12} className="opacity-60" />
        </div>
      ))}

      {streamingText && (
        <div className="flex justify-start animate-in fade-in duration-100">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed shadow-sm">
            {streamingText}
            <span className="inline-block w-1.5 h-3 bg-indigo-500 ml-0.5 animate-pulse" />
          </div>
        </div>
      )}

      {isLoading && !streamingText && activeTools.length === 0 && (
        <div className="flex justify-start items-center p-1 gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

interface CopilotInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  hasMessages: boolean;
  onSelectSuggestion: (text: string) => void;
}

const CopilotInput: React.FC<CopilotInputProps> = ({
  inputValue,
  setInputValue,
  isLoading,
  onSubmit,
  hasMessages,
  onSelectSuggestion
}) => {
  return (
    <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/10">
      {hasMessages && !isLoading && (
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 custom-scrollbar-horizontal select-none">
          {QUICK_SUGGESTIONS.slice(0, 2).map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(s.text)}
              className="flex-shrink-0 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isLoading}
          placeholder={isLoading ? 'Copilot is running...' : 'Ask Copilot...'}
          className="w-full pl-4 pr-11 py-2.5 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 border-none ring-1 ring-slate-200/50 dark:ring-slate-700/50 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-500 outline-none text-slate-800 dark:text-white transition-all placeholder-slate-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="absolute right-1.5 p-2 rounded-xl bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 transition-all hover:scale-105 active:scale-95 disabled:scale-100 shadow-sm"
        >
          {isLoading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
        </button>
      </form>
    </div>
  )
}

export function AgentCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState<{ name: string; args?: any }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('task-tracker-copilot-messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load copilot messages', e);
    }
  }, []);

  const saveMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    try {
      const cleanMsgs = msgs.filter(m => m.role === 'user' || m.role === 'assistant');
      localStorage.setItem('task-tracker-copilot-messages', JSON.stringify(cleanMsgs));
    } catch (e) {
      console.error('Failed to save copilot messages', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, activeTools]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your Copilot chat history?')) {
      saveMessages([]);
      setStreamingText('');
      setActiveTools([]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    saveMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingText('');
    setActiveTools([]);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant') })
      });

      if (!response.ok) {
        throw new Error(`Agent request failed (${response.status})`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('ReadableStream not supported on response.');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';
      let activeLoopMessages = [...updatedMessages];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let event;
          try {
            event = JSON.parse(trimmed);
          } catch (e) {
            console.error('Failed to parse NDJSON line:', trimmed, e);
            continue;
          }

          if (event.type === 'error') {
            throw new Error(event.error);
          }

          if (event.type === 'text') {
            accumulatedText += event.delta;
            setStreamingText(accumulatedText);
          } 
          else if (event.type === 'tool_call') {
            setActiveTools(prev => [...prev, { name: event.name, args: event.arguments }]);
          } 
          else if (event.type === 'tool_result') {
            setActiveTools(prev => prev.filter(t => t.name !== event.name));
            
            const isError = !!event.result?.error;
            const resultMsg: ChatMessage = {
              role: 'tool',
              name: event.name,
              content: JSON.stringify(event.result),
              isCompleted: !isError,
              isError: isError
            };
            
            activeLoopMessages.push(resultMsg);
            saveMessages([...activeLoopMessages]);
          }
        }
      }

      if (accumulatedText) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: accumulatedText };
        saveMessages([...activeLoopMessages, assistantMsg]);
      }
      setStreamingText('');

    } catch (err: any) {
      console.error('[Copilot Stream Error]:', err);
      const errMsg: ChatMessage = { 
        role: 'assistant', 
        content: `Error: ${err.message || 'Failed to communicate with Copilot. Please check settings/API key.'}`,
        isError: true
      };
      saveMessages([...updatedMessages, errMsg]);
    } finally {
      setIsLoading(false);
      setActiveTools([]);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform z-50 group hover:scale-105 active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rotate-90' 
            : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white'
        }`}
        aria-label="Toggle Copilot Chat"
      >
        {isOpen ? (
          <X size={22} className="transition-transform duration-200" />
        ) : (
          <div className="relative">
            <Sparkles size={22} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-indigo-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-indigo-500 rounded-full" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-3xl shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          <CopilotHeader 
            hasMessages={messages.length > 0} 
            onClearHistory={handleClearHistory} 
            onClose={() => setIsOpen(false)} 
          />

          <CopilotMessageThread
            messages={messages}
            streamingText={streamingText}
            activeTools={activeTools}
            isLoading={isLoading}
            onSelectSuggestion={handleSendMessage}
            messagesEndRef={messagesEndRef}
            threadContainerRef={threadContainerRef}
          />

          <CopilotInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            hasMessages={messages.length > 0}
            onSelectSuggestion={handleSendMessage}
          />

        </div>
      )}
    </>
  );
}
