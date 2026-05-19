import { EventEmitter } from 'events';

// Store the emitter on global to prevent multiple instances during hot reloading in Next.js
const globalForRealtime = global as unknown as { realtimeEmitter: EventEmitter };

export const realtimeEmitter =
  globalForRealtime.realtimeEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') {
  globalForRealtime.realtimeEmitter = realtimeEmitter;
}

export const EVENTS = {
  LEAD_ASSIGNED: 'lead:assigned',
  QUOTAS_RESET: 'quotas:reset',
};

/**
 * Dispatches an event to the real-time stream when a new lead is created and assigned.
 */
export function notifyLeadAssigned(leadId: string, assignedProviders: string[]) {
  realtimeEmitter.emit(EVENTS.LEAD_ASSIGNED, {
    leadId,
    assignedProviders,
    timestamp: Date.now(),
  });
}

/**
 * Dispatches an event when quotas are reset.
 */
export function notifyQuotasReset(eventId: string) {
  realtimeEmitter.emit(EVENTS.QUOTAS_RESET, {
    eventId,
    timestamp: Date.now(),
  });
}
