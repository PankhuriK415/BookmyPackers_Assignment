import { NextRequest, NextResponse } from 'next/server';
import { processWebhookSubscription } from '@/lib/webhook';
import { seedIfNeeded } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Ensure the database is seeded automatically
  await seedIfNeeded();

  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required field: eventId' },
        { status: 400 }
      );
    }

    const result = await processWebhookSubscription(eventId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    if (result.alreadyProcessed) {
      // 208 Already Reported (or 200 OK with status message)
      return NextResponse.json(
        { 
          success: true, 
          message: result.message,
          idempotent: true,
          status: 'already_processed'
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      idempotent: true,
      status: 'processed'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook endpoint error:', error);
    return NextResponse.json(
      { error: 'Invalid request body or internal error.' },
      { status: 500 }
    );
  }
}
