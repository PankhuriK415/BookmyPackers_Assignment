import { prisma } from './db';

/**
 * Fetches the remaining and monthly quotas for all providers in alphabetical order.
 */
export async function getProviderQuotas() {
  return prisma.provider.findMany({
    select: {
      id: true,
      name: true,
      monthlyQuota: true,
      remainingQuota: true,
    },
    orderBy: {
      id: 'asc',
    },
  });
}

/**
 * Atomic quota reset action. Updates remaining quotas for all providers to their monthly limits.
 */
export async function resetAllQuotas(tx: any) {
  const db = tx || prisma;
  return db.provider.updateMany({
    data: {
      remainingQuota: 10,
    },
  });
}
