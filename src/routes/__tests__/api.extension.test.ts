import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react-router createFileRoute
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (path: string) => {
    return (options: any) => ({
      path,
      options,
    });
  },
}));

// Mock verifyExtensionToken
const mockVerifyExtensionToken = vi.fn();
vi.mock('../../services/extensionAuth', () => ({
  verifyExtensionToken: (token: any) => mockVerifyExtensionToken(token),
}));

// Mock fs/promises
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();

vi.mock('node:fs/promises', () => ({
  readFile: (...args: any[]) => mockReadFile(...args),
  writeFile: (...args: any[]) => mockWriteFile(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
}));

import { Route } from '../api.extension';

describe('api.extension route handlers', () => {
  const handlers = (Route as any).options.server.handlers;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyExtensionToken.mockResolvedValue(true);
  });

  describe('GET handler', () => {
    it('returns 401 if unauthorized', async () => {
      mockVerifyExtensionToken.mockResolvedValue(false);
      const request = new Request('http://localhost/api/extension', {
        headers: { 'X-Extension-Auth': 'bad-token' },
      });

      const response = await handlers.GET({ request });
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    it('returns clips and timer state if authorized', async () => {
      const mockClips = [{ id: '1', title: 'Test Clip', totalSeconds: 100 }];
      const mockTimer = { isRunning: true, startTime: 123456, taskName: 'Test Task' };

      mockReadFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('extension-')) {
          return JSON.stringify(mockClips);
        }
        if (filePath.includes('active-timer')) {
          return JSON.stringify(mockTimer);
        }
        throw new Error('File not found');
      });

      const request = new Request('http://localhost/api/extension', {
        headers: { 'X-Extension-Auth': 'valid-token' },
      });

      const response = await handlers.GET({ request });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.clips).toEqual(mockClips);
      expect(body.timerState).toEqual(mockTimer);
    });
  });

  describe('OPTIONS handler', () => {
    it('returns 204 with CORS headers', async () => {
      const request = new Request('http://localhost/api/extension', {
        method: 'OPTIONS',
      });
      const response = await handlers.OPTIONS({ request });
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS');
    });
  });

  describe('POST handler', () => {
    it('returns 401 if unauthorized', async () => {
      mockVerifyExtensionToken.mockResolvedValue(false);
      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'bad-token' },
        body: JSON.stringify({ type: 'TOGGLE_TIMER' }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(401);
    });

    it('handles TOGGLE_TIMER - starting a stopped timer', async () => {
      vi.useFakeTimers();
      const now = 1774895000000;
      vi.setSystemTime(new Date(now));

      // Mock empty file read (so it uses default state)
      mockReadFile.mockRejectedValue(new Error('ENOENT'));

      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify({ type: 'TOGGLE_TIMER', taskName: 'Start Task' }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.timerState.isRunning).toBe(true);
      expect(body.timerState.startTime).toBe(now);
      expect(body.timerState.taskName).toBe('Start Task');

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('active-timer.json'),
        JSON.stringify({
          isRunning: true,
          startTime: now,
          accumulatedSeconds: 0,
          taskName: 'Start Task',
        }, null, 2)
      );

      vi.useRealTimers();
    });

    it('handles TOGGLE_TIMER - stopping a running timer', async () => {
      vi.useFakeTimers();
      const startTime = 1774895000000;
      const stopTime = startTime + 5000; // 5 seconds later
      vi.setSystemTime(new Date(startTime));

      // Active running timer state
      const initialTimer = {
        isRunning: true,
        startTime: startTime,
        accumulatedSeconds: 10,
        taskName: 'Running Task',
      };
      mockReadFile.mockResolvedValue(JSON.stringify(initialTimer));

      // Advance time to stopTime
      vi.setSystemTime(new Date(stopTime));

      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify({ type: 'TOGGLE_TIMER' }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.timerState.isRunning).toBe(false);
      expect(body.timerState.startTime).toBeNull();
      expect(body.timerState.accumulatedSeconds).toBe(15); // 10 initial + 5 elapsed

      vi.useRealTimers();
    });

    it('handles SAVE_TIMER - saving accumulated time', async () => {
      vi.useFakeTimers();
      const startTime = 1774895000000;
      vi.setSystemTime(new Date(startTime + 10000)); // Current time is 10s after start

      const timerState = {
        isRunning: true,
        startTime: startTime,
        accumulatedSeconds: 5,
        taskName: 'Sample Task',
      };
      // Mock timer file content
      mockReadFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('active-timer')) {
          return JSON.stringify(timerState);
        }
        if (filePath.includes('extension-')) {
          return JSON.stringify([]); // empty existing clips
        }
        throw new Error('File not found');
      });

      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify({ type: 'SAVE_TIMER' }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);
      const body = await response.json();

      // Should return reset timer state
      expect(body.timerState).toEqual({
        isRunning: false,
        startTime: null,
        accumulatedSeconds: 0,
        taskName: '',
      });

      // Should write new clip to extension file (total elapsed: 5 accumulated + 10 current session = 15)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('extension-'),
        expect.stringContaining('"totalSeconds": 15')
      );

      vi.useRealTimers();
    });

    it('handles CLEAR_TIMER', async () => {
      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify({ type: 'CLEAR_TIMER' }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.timerState).toEqual({
        isRunning: false,
        startTime: null,
        accumulatedSeconds: 0,
        taskName: '',
      });
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('active-timer.json'),
        JSON.stringify({ isRunning: false, startTime: null, accumulatedSeconds: 0, taskName: '' }, null, 2)
      );
    });

    it('handles UPDATE_TIMER', async () => {
      const initialTimer = {
        isRunning: false,
        startTime: null,
        accumulatedSeconds: 5,
        taskName: 'Old Task',
      };
      mockReadFile.mockResolvedValue(JSON.stringify(initialTimer));

      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify({
          type: 'UPDATE_TIMER',
          isRunning: true,
          accumulatedSeconds: 20,
          startTime: 1234567,
        }),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.timerState.isRunning).toBe(true);
      expect(body.timerState.accumulatedSeconds).toBe(20);
      expect(body.timerState.startTime).toBe(1234567);
    });

    it('handles default behavior - saving text clips', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify([]));

      const clipPayload = {
        title: 'Snippet',
        content: 'Console.log()',
      };

      const request = new Request('http://localhost/api/extension', {
        method: 'POST',
        headers: { 'X-Extension-Auth': 'valid-token' },
        body: JSON.stringify(clipPayload),
      });

      const response = await handlers.POST({ request });
      expect(response.status).toBe(200);

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('extension-'),
        expect.stringContaining('"content": "Console.log()"')
      );
    });
  });
});
