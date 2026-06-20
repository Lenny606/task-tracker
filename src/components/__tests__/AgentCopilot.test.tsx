import { describe, it, expect, vi } from 'vitest';
import { readAgentStream } from '../AgentCopilot';

describe('readAgentStream helper', () => {
  it('should successfully read and parse single JSON stream event', async () => {
    const events: any[] = [];
    const encoder = new TextEncoder();
    
    // Mock data
    const mockData = JSON.stringify({ type: 'text', delta: 'Hello' }) + '\n';
    const chunk = encoder.encode(mockData);

    let called = false;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (!called) {
          called = true;
          return { done: false, value: chunk };
        }
        return { done: true, value: undefined };
      }),
      releaseLock: vi.fn(),
      cancel: vi.fn(),
    } as any;

    await readAgentStream(mockReader, (e) => {
      events.push(e);
    });

    expect(events).toEqual([{ type: 'text', delta: 'Hello' }]);
  });

  it('should handle multi-line stream events', async () => {
    const events: any[] = [];
    const encoder = new TextEncoder();
    
    const mockData = 
      JSON.stringify({ type: 'text', delta: 'Hello' }) + '\n' +
      JSON.stringify({ type: 'tool_call', name: 'my_tool' }) + '\n';
    const chunk = encoder.encode(mockData);

    let called = false;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (!called) {
          called = true;
          return { done: false, value: chunk };
        }
        return { done: true, value: undefined };
      }),
      releaseLock: vi.fn(),
      cancel: vi.fn(),
    } as any;

    await readAgentStream(mockReader, (e) => {
      events.push(e);
    });

    expect(events).toEqual([
      { type: 'text', delta: 'Hello' },
      { type: 'tool_call', name: 'my_tool' },
    ]);
  });

  it('should buffer and correctly merge partial lines split across chunks', async () => {
    const events: any[] = [];
    const encoder = new TextEncoder();
    
    const chunk1 = encoder.encode('{"type": "text", ');
    const chunk2 = encoder.encode('"delta": "World"}\n');

    let readCount = 0;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        readCount++;
        if (readCount === 1) {
          return { done: false, value: chunk1 };
        } else if (readCount === 2) {
          return { done: false, value: chunk2 };
        }
        return { done: true, value: undefined };
      }),
      releaseLock: vi.fn(),
      cancel: vi.fn(),
    } as any;

    await readAgentStream(mockReader, (e) => {
      events.push(e);
    });

    expect(events).toEqual([{ type: 'text', delta: 'World' }]);
  });

  it('should ignore empty lines and handle invalid JSON without throwing', async () => {
    const events: any[] = [];
    const encoder = new TextEncoder();
    
    const mockData = 
      '\n' + // empty line
      'invalid-json\n' + // invalid JSON
      JSON.stringify({ type: 'text', delta: 'Done' }) + '\n';
    const chunk = encoder.encode(mockData);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let called = false;
    const mockReader = {
      read: vi.fn().mockImplementation(async () => {
        if (!called) {
          called = true;
          return { done: false, value: chunk };
        }
        return { done: true, value: undefined };
      }),
      releaseLock: vi.fn(),
      cancel: vi.fn(),
    } as any;

    await readAgentStream(mockReader, (e) => {
      events.push(e);
    });

    expect(events).toEqual([{ type: 'text', delta: 'Done' }]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
