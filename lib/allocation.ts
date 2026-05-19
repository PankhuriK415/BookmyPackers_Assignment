import { Prisma } from '@prisma/client';

// Mandatory providers per service
export const MANDATORY_PROVIDERS: Record<string, string[]> = {
  'service-1': ['provider-1'],
  'service-2': ['provider-5'],
  'service-3': ['provider-1', 'provider-4'],
};

// Fair allocation pools per service
export const ALLOCATION_POOLS: Record<string, string[]> = {
  'service-1': ['provider-2', 'provider-3', 'provider-4'],
  'service-2': ['provider-6', 'provider-7', 'provider-8'],
  'service-3': ['provider-2', 'provider-3', 'provider-5', 'provider-6', 'provider-7', 'provider-8'],
};

/**
 * Distributes a lead to exactly 3 providers using a combination of
 * mandatory assignments and persistent round-robin on the designated pools.
 * 
 * Must be executed within a Prisma transaction block that enforces row-level locking (SELECT FOR UPDATE)
 * in alphabetical ID order to prevent deadlocks and race conditions.
 */
export async function allocateProvidersForLead(
  tx: Prisma.TransactionClient,
  leadId: string,
  serviceId: string
): Promise<string[]> {
  // 1. Lock the AllocationState for this service to serialize allocation decisions
  const states: any[] = await tx.$queryRaw`
    SELECT * FROM "AllocationState" 
    WHERE "serviceId" = ${serviceId} 
    FOR UPDATE
  `;

  const state = states[0];
  if (!state) {
    throw new Error(`AllocationState not found for service: ${serviceId}`);
  }

  let lastPointer = state.lastProviderIndex;

  // 2. Fetch all providers and lock their rows in alphabetical order of ID
  // Sorting prevents deadlocks if parallel transactions attempt to lock the same rows
  const allProviders: any[] = await tx.$queryRaw`
    SELECT * FROM "Provider" 
    ORDER BY "id" ASC 
    FOR UPDATE
  `;
  
  const providerMap = new Map<string, typeof allProviders[0]>();
  for (const p of allProviders) {
    providerMap.set(p.id, p);
  }

  const assignedProviderIds: string[] = [];

  // 3. Phase 1: Allocate mandatory providers if they have remaining quota
  const mandatoryIds = MANDATORY_PROVIDERS[serviceId] || [];
  for (const pid of mandatoryIds) {
    const p = providerMap.get(pid);
    if (p && p.remainingQuota > 0) {
      assignedProviderIds.push(pid);
    }
  }

  // 4. Phase 2: Allocate from the fair round-robin pool to reach exactly 3 providers
  const needed = 3 - assignedProviderIds.length;
  const pool = ALLOCATION_POOLS[serviceId] || [];

  if (needed > 0 && pool.length > 0) {
    let selectedFromPool = 0;
    let iterations = 0;
    let currentIndex = lastPointer;

    while (selectedFromPool < needed && iterations < pool.length) {
      currentIndex = (currentIndex + 1) % pool.length;
      iterations++;

      const candidateId = pool[currentIndex];

      // Ensure the provider is not already assigned as a mandatory one
      if (assignedProviderIds.includes(candidateId)) {
        continue;
      }

      const provider = providerMap.get(candidateId);
      if (provider && provider.remainingQuota > 0) {
        assignedProviderIds.push(candidateId);
        selectedFromPool++;
        lastPointer = currentIndex; // Advance pointer to the newly allocated provider index
      }
    }
  }

  // 5. Update AllocationState's lastProviderIndex in the database
  await tx.allocationState.update({
    where: { serviceId },
    data: { lastProviderIndex: lastPointer },
  });

  // 6. Create assignments and decrement remaining quotas atomically
  for (const pid of assignedProviderIds) {
    await tx.leadAssignment.create({
      data: {
        leadId,
        providerId: pid,
      },
    });

    await tx.provider.update({
      where: { id: pid },
      data: {
        remainingQuota: {
          decrement: 1,
        },
      },
    });
  }

  return assignedProviderIds;
}
