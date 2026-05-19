import { NextRequest, NextResponse } from 'next/server';
import { prisma, seedIfNeeded } from '@/lib/db';
import { allocateProvidersForLead } from '@/lib/allocation';
import { notifyLeadAssigned } from '@/lib/realtime';

export async function POST(request: NextRequest) {
  // Ensure the database is seeded automatically
  await seedIfNeeded();

  try {
    const body = await request.json();
    const { name, phone, city, serviceId, description } = body;

    // Validate fields
    if (!name || !phone || !city || !serviceId) {
      return NextResponse.json(
        { error: 'Name, phone, city, and service type are required fields.' },
        { status: 400 }
      );
    }

    // Process lead creation and allocation within a single secure database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Attempt to insert the lead
      let lead;
      try {
        lead = await tx.lead.create({
          data: {
            name,
            phone,
            city,
            serviceId,
            description: description || '',
          },
        });
      } catch (err: any) {
        // Handle database unique constraint violation (phone + serviceId)
        if (err.code === 'P2002') {
          return {
            duplicate: true,
            message: 'A lead with this phone number for the selected service type already exists.',
          };
        }
        throw err;
      }

      // 2. Distribute lead to exactly 3 providers using our allocation engine
      const assignedProviders = await allocateProvidersForLead(tx, lead.id, serviceId);

      return {
        duplicate: false,
        lead,
        assignedProviders,
      };
    });

    if (result.duplicate) {
      return NextResponse.json(
        { error: result.message },
        { status: 409 } // Conflict
      );
    }

    // 3. Notify real-time dashboard listeners of the successful assignment
    if (result.lead && result.assignedProviders) {
      notifyLeadAssigned(result.lead.id, result.assignedProviders);
    }

    return NextResponse.json({
      success: true,
      message: 'Lead created and distributed successfully.',
      lead: result.lead,
      assignedProviders: result.assignedProviders,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error handling lead submission:', error);
    return NextResponse.json(
      { error: error.message || 'An internal server error occurred while processing the lead.' },
      { status: 500 }
    );
  }
}
