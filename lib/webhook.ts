import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { notifyQuotasReset } from './realtime';

export interface WebhookResult {
  success: boolean;
  alreadyProcessed: boolean;
  message: string;
}

/**
 * Transactionally processes a quota reset subscription webhook.
 * Guarantees strict HTTP idempotency using `eventId` as a unique database-level key.
 */
export async function processWebhookSubscription(eventId: string): Promise<WebhookResult> {
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return {
      success: false,
      alreadyProcessed: false,
      message: 'Invalid eventId provided.',
    };
  }

  // 1. Check if the event has already been processed to short-circuit outside the transaction (performance check)
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });

  if (existingEvent) {
    return {
      success: true,
      alreadyProcessed: true,
      message: `Webhook event '${eventId}' already processed at ${existingEvent.processedAt.toISOString()}. No action taken.`,
    };
  }

  try {
    // 2. Perform transactional verification and write
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check again inside the transaction with a row lock or insert directly
      // In PostgreSQL, trying to insert directly with error catch is very standard,
      // but double check is also safe. Let's do a direct write:
      try {
        await tx.webhookEvent.create({
          data: { eventId },
        });
      } catch (err: any) {
        // Unique key constraint violation indicates concurrent retry succeeded first
        if (err.code === 'P2002') {
          return {
            alreadyProcessed: true,
            message: `Concurrent collision: Webhook event '${eventId}' is being or has been processed.`,
          };
        }
        throw err;
      }

      // Reset all provider quotas to 10
      await tx.provider.updateMany({
        data: {
          remainingQuota: 10,
        },
      });

      return {
        alreadyProcessed: false,
        message: `Quotas successfully reset for all providers.`,
      };
    });

    if (!result.alreadyProcessed) {
      // Trigger real-time event to refresh dashboard
      notifyQuotasReset(eventId);
      return {
        success: true,
        alreadyProcessed: false,
        message: result.message,
      };
    } else {
      return {
        success: true,
        alreadyProcessed: true,
        message: result.message,
      };
    }
  } catch (error: any) {
    console.error('Error executing webhook transaction:', error);
    return {
      success: false,
      alreadyProcessed: false,
      message: `Database error executing transaction: ${error.message || error}`,
    };
  }
}
