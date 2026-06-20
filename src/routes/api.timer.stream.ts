import { createFileRoute } from '@tanstack/react-router';
import { verifyExtensionToken } from '../services/extensionAuth';
import { timerEventEmitter } from '../services/timerEvents';

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = 
    origin.startsWith('chrome-extension://') || 
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:');
  
  const allowOrigin = isAllowedOrigin ? origin : 'http://localhost:3000';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Extension-Auth',
    'Access-Control-Max-Age': '86400',
  };
}

export const Route = createFileRoute('/api/timer/stream')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request);
        const url = new URL(request.url);
        const incomingToken = request.headers.get('X-Extension-Auth') || url.searchParams.get('token');

        if (!(await verifyExtensionToken(incomingToken))) {
          return new Response(JSON.stringify({ error: 'Unauthorized: Invalid extension authentication token.' }), {
            status: 401,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          });
        }

        const headers = {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        };

        const stream = new ReadableStream({
          start(controller) {
            // Send initial connection event
            try {
              controller.enqueue(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
            } catch (e) {}

            const listener = (data: any) => {
              try {
                controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
              } catch (err) {
                // Connection might be closed
              }
            };

            timerEventEmitter.on('update', listener);

            request.signal.addEventListener('abort', () => {
              timerEventEmitter.off('update', listener);
            });
          }
        });

        return new Response(stream, { headers });
      },
      OPTIONS: async ({ request }) => {
        const corsHeaders = getCorsHeaders(request);
        return new Response(null, {
          status: 204,
          headers: corsHeaders
        });
      }
    }
  }
});
