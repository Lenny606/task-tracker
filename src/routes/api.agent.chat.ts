import { createFileRoute } from '@tanstack/react-router';
import { runAgentLoop } from '../services/agentService';

export const Route = createFileRoute('/api/agent/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let messages = [];
        let context = undefined;
        try {
          const body = await request.json();
          messages = body.messages || [];
          context = body.context;
        } catch (e) {
          return new Response(JSON.stringify({ error: 'Invalid JSON request body.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              await runAgentLoop(messages, (event) => {
                const chunk = JSON.stringify(event) + '\n';
                controller.enqueue(encoder.encode(chunk));
              }, context);
              controller.close();
            } catch (err: any) {
              const errChunk = JSON.stringify({ type: 'error', error: err.message || String(err) }) + '\n';
              controller.enqueue(encoder.encode(errChunk));
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        });
      }
    }
  }
});
