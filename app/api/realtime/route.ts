import { NextRequest } from 'next/server';
import { realtimeEmitter, EVENTS } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Write connection establish headers/message
  const sendEvent = (event: string, data: any) => {
    try {
      writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch (err) {
      console.error('SSE Write Error:', err);
    }
  };

  // Send an initial handshake event
  sendEvent('connected', { status: 'established', time: Date.now() });

  // Event handlers
  const onLeadAssigned = (data: any) => {
    sendEvent('lead_assigned', data);
  };

  const onQuotasReset = (data: any) => {
    sendEvent('quotas_reset', data);
  };

  // Register listeners on the shared event bus
  realtimeEmitter.on(EVENTS.LEAD_ASSIGNED, onLeadAssigned);
  realtimeEmitter.on(EVENTS.QUOTAS_RESET, onQuotasReset);

  // Proactively clean up event listeners when the client disconnects or times out
  request.signal.addEventListener('abort', () => {
    realtimeEmitter.off(EVENTS.LEAD_ASSIGNED, onLeadAssigned);
    realtimeEmitter.off(EVENTS.QUOTAS_RESET, onQuotasReset);
    try {
      writer.close();
    } catch (_) {}
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}
