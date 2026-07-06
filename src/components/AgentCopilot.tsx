import React, { useState, useEffect, useRef } from 'react';
import { useRouterState } from '@tanstack/react-router';
import {
  Sparkles, 
  Trash2, 
  X, 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database,
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
  // UI-only properties to track processing states
  isExecuting?: boolean;
  isCompleted?: boolean;
  isError?: boolean;
}

const QUICK_SUGGESTIONS = [
  { label: 'Prepare worklogs', text: "Prepare my tasks for today's worklog from my git commits: link JIRA issues to matching tasks and create suggestions for the rest. Don't change any tracked time." },
  { label: 'Summarize today', text: "Summarize today's tasks and time tracked." },
  { label: 'Show my tasks', text: 'Show all my local tasks for today.' },
  { label: 'Find JIRA issues', text: 'Search for active JIRA issues in my project.' },
];

export function AgentCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState<{ name: string; args?: any }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadContainerRef = useRef<HTMLDivElement>(null);

  // Track the current UI location so the agent can resolve "today" / "this day".
  const location = useRouterState({ select: (s) => s.location });

  // 1. Persistence - Load messages from localStorage on mount
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

  // Save messages to localStorage
  const saveMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    try {
      const cleanMsgs = msgs.filter(m => m.role === 'user' || m.role === 'assistant');
      localStorage.setItem('task-tracker-copilot-messages', JSON.stringify(cleanMsgs));
    } catch (e) {
      console.error('Failed to save copilot messages', e);
    }
  };

  // Scroll to bottom on updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, activeTools]);

  // Clear communication history
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your Copilot chat history?')) {
      saveMessages([]);
      setStreamingText('');
      setActiveTools([]);
      setIsLoading(false);
    }
  };

  // Send message to the backend streaming endpoint
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    const updatedMessages = [...messages, userMsg];
    saveMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingText('');
    setActiveTools([]);

    // Build the UI context sent alongside the conversation so the agent knows
    // which day/view the user is currently looking at.
    const today = new Date().toISOString().split('T')[0];
    const search = (location.search || {}) as Record<string, any>;
    const context = {
      currentDate: today,
      route: location.pathname,
      viewedDate: search.date || today,
    };

    try {
      // Fetch TanStack Start NDJSON endpoint
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant'),
          context,
        })
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
            // Highlight active tool execution in UI
            setActiveTools(prev => [...prev, { name: event.name, args: event.arguments }]);
          } 
          else if (event.type === 'tool_result') {
            // Convert tool results to UI messages and clean up pending tools
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

      // Append finalized assistant response
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

  // Humanize tool names for logs
  const formatToolName = (name: string) => {
    return name
      .replace('prepare_worklog_context', 'Worklog: gather context')
      .replace('task_link_jira', 'Tasks: link JIRA')
      .replace('task_create_suggestion', 'Tasks: suggest task')
      .replace('tracker_', 'Local Tracker: ')
      .replace('task_', 'Tasks: ')
      .replace('jira_', 'JIRA: ')
      .replace('git_', 'Git: ')
      .replace('generate_daily_report', 'AI: daily report')
      .replace(/_/g, ' ');
  };

  return (
    <>
      {/* 1. FLOATING ACTION BUTTON */}
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

      {/* 2. CHAT DRAWER MODAL */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[580px] max-h-[calc(100vh-8rem)] rounded-3xl shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/80 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* HEADER */}
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
              {messages.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all"
                  title="Clear history"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* CHAT THREAD */}
          <div 
            ref={threadContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
          >
            {messages.length === 0 && !streamingText && activeTools.length === 0 && (
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
                      onClick={() => handleSendMessage(s.text)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-500/20 dark:border-slate-800/40 dark:hover:border-indigo-500/30 bg-slate-50/50 hover:bg-indigo-50/30 dark:bg-slate-800/20 dark:hover:bg-indigo-950/20 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center justify-between"
                    >
                      {s.label}
                      <ChevronRight size={12} className="opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES THREAD */}
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

            {/* ACTIVE TOOL EXECUTION INDICATOR */}
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

            {/* STREAMING ASSISTANT TEXT */}
            {streamingText && (
              <div className="flex justify-start animate-in fade-in duration-100">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed shadow-sm">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3 bg-indigo-500 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {/* LOADER Spinner if no text returned yet but backend thinking */}
            {isLoading && !streamingText && activeTools.length === 0 && (
              <div className="flex justify-start items-center p-1 gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-950/10">
            {messages.length > 0 && !isLoading && (
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 custom-scrollbar-horizontal select-none">
                {QUICK_SUGGESTIONS.slice(0, 2).map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.text)}
                    className="flex-shrink-0 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex items-center gap-2 relative"
            >
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

        </div>
      )}
    </>
  );
}
