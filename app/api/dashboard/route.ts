import { NextResponse } from 'next/server';
import { prisma, seedIfNeeded } from '@/lib/db';

// Force dynamic fetch since we are returning real-time database state
export const dynamic = 'force-dynamic';

export async function GET() {
  await seedIfNeeded();

  try {
    // 1. Fetch all providers with their quotas
    const providers = await prisma.provider.findMany({
      orderBy: { id: 'asc' },
    });

    // 2. Fetch all leads with their assigned service name, ordered by most recent first
    const leads = await prisma.lead.findMany({
      include: {
        service: true,
        assignments: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Flatten or prepare a direct log of all allocations for easy display
    const assignments = await prisma.leadAssignment.findMany({
      include: {
        lead: {
          include: {
            service: true,
          },
        },
        provider: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      providers,
      leads,
      assignments,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve dashboard data.' },
      { status: 500 }
    );
  }
}
