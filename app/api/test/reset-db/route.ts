import { NextResponse } from 'next/server';
import { prisma, seedIfNeeded } from '@/lib/db';
import { notifyQuotasReset } from '@/lib/realtime';

export async function POST() {
  await seedIfNeeded();

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete all assignments
      await tx.leadAssignment.deleteMany({});
      // 2. Delete all leads
      await tx.lead.deleteMany({});
      // 3. Delete all webhook events
      await tx.webhookEvent.deleteMany({});
      // 4. Reset round-robin state pointers to -1
      await tx.allocationState.updateMany({
        data: {
          lastProviderIndex: -1,
        },
      });
      // 5. Restore provider quotas
      await tx.provider.updateMany({
        data: {
          remainingQuota: 10,
        },
      });
    });

    // Notify listeners of global system state change
    notifyQuotasReset('reset-db-action');

    return NextResponse.json({
      success: true,
      message: 'System database state has been successfully wiped and reset to seeds.',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset system database state.' },
      { status: 500 }
    );
  }
}
