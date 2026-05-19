# Concurrency & Database Consistency

This document details the transaction strategy and locking mechanisms employed to handle multiple simultaneous lead creations without quota oversell or assignment anomalies.

> [!WARNING]
> When multiple leads are created simultaneously, race conditions can cause:
> 1. Double-decrementing a provider's quota past zero (Quota Overflow).
> 2. Multiple threads reading the same `AllocationState` simultaneously, leading to duplicated assignments (Repetition Bias / Pointer Collision).
> 3. Duplicate leads for the same customer phone and service.

## Concurrency Protection Stack

To completely eliminate race conditions, the system uses a three-tier transaction guard:

### 1. Unique Constraints at DB Level (Hard Constraints)
We enforce uniqueness at the PostgreSQL database level using composite unique indexes:
* `UNIQUE("phone", "serviceId")` on the `Lead` table prevents duplicate leads for the same customer and service, even under simultaneous high-frequency API calls.
* `UNIQUE("leadId", "providerId")` on the `LeadAssignment` table guarantees a provider can never be assigned to the same lead twice.

### 2. Row-Level Pessimistic Locking (SELECT FOR UPDATE)
We use Prisma's interactive transactions (`tx.$transaction`) combined with raw SQL `FOR UPDATE` queries:
```typescript
await tx.$queryRaw`
  SELECT * FROM "AllocationState" 
  WHERE "serviceId" = ${serviceId} 
  FOR UPDATE
`
```
And:
```typescript
await tx.$queryRaw`
  SELECT * FROM "Provider" 
  WHERE "id" IN (${Prisma.join(providerIds)}) 
  FOR UPDATE
`
```

#### Lock Execution Flow:
1. **Transaction Begins**: An interactive transaction is started.
2. **Lock Allocation Pointer**: We query the `AllocationState` for the requested service using `FOR UPDATE`. This blocks other concurrent transactions for the same service from reading or modifying the pointer until this transaction commits.
3. **Determine Selected Providers**: The engine calculates the mandatory and round-robin providers based on the locked pointer and their locked quotas.
4. **Lock Providers**: We execute a `FOR UPDATE` query on the selected providers. This ensures their `remainingQuota` cannot be read or decremented by another parallel transaction.
5. **Validation**: The system verifies that the provider's `remainingQuota > 0`.
6. **Perform Actions**:
   - Write the new `Lead` and `LeadAssignment` records.
   - Decrement the providers' `remainingQuota` atomically.
   - Update `lastProviderIndex` in `AllocationState`.
7. **Commit & Release**: The transaction commits, releasing the row locks for waiting requests, which then execute safely in a perfectly serialized sequence.

### 3. Atomic Quota Decrements
By locking the rows before modifying them, we guarantee that the write operation is based on accurate, locked-in data. The remaining quota will never decrement below zero.
