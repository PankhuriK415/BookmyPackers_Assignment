import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'info', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Auto-seeding logic
export async function seedIfNeeded() {
  try {
    const serviceCount = await prisma.service.count();
    if (serviceCount === 0) {
      console.log('No services found in database. Starting auto-seeding...');

      // Seed services
      const services = [
        { id: 'service-1', name: 'Service 1' },
        { id: 'service-2', name: 'Service 2' },
        { id: 'service-3', name: 'Service 3' },
      ];

      for (const service of services) {
        await prisma.service.upsert({
          where: { id: service.id },
          update: {},
          create: service,
        });

        // Initialize allocation state if not exists
        await prisma.allocationState.upsert({
          where: { serviceId: service.id },
          update: {},
          create: {
            serviceId: service.id,
            lastProviderIndex: -1,
          },
        });
      }

      // Seed 8 providers with quota = 10
      const providers = Array.from({ length: 8 }, (_, i) => ({
        id: `provider-${i + 1}`,
        name: `Provider ${i + 1}`,
        monthlyQuota: 10,
        remainingQuota: 10,
      }));

      for (const provider of providers) {
        await prisma.provider.upsert({
          where: { id: provider.id },
          update: {},
          create: provider,
        });
      }

      console.log('Database auto-seeding completed successfully!');
    }
  } catch (error) {
    console.error('Error during database auto-seeding:', error);
  }
}
