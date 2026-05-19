# Lead Allocation Algorithm

This document describes the two-tiered Lead Allocation Algorithm designed to distribute customer leads fairly and consistently to service providers.

> [!IMPORTANT]
> The engine must allocate **exactly 3 providers** per lead, respect remaining quotas, and run in a deterministic, state-persistent round-robin manner.

## Rules Specification

The distribution operates in two sequential phases:

### Phase 1: Mandatory Allocations
Each service has specific, contractually-bound mandatory providers. These are allocated first:
* **Service 1**: Provider 1 (requires 2 additional from pool)
* **Service 2**: Provider 5 (requires 2 additional from pool)
* **Service 3**: Provider 1 + Provider 4 (requires 1 additional from pool)

*Note: A mandatory provider is only allocated if their `remainingQuota > 0`.*

### Phase 2: Fair Pool Allocation
The remaining slots (to reach exactly 3 providers) are chosen from service-specific round-robin pools:
* **Service 1 Pool**: `[Provider 2, Provider 3, Provider 4]`
* **Service 2 Pool**: `[Provider 6, Provider 7, Provider 8]`
* **Service 3 Pool**: `[Provider 2, Provider 3, Provider 5, Provider 6, Provider 7, Provider 8]`

## Round-Robin Mechanism (Deterministic & Persistent)

To achieve strict fairness and prevent "repetition bias" (favoring providers at the start of the list), the pointer is stored in the database.

### Step-by-Step Logic
1. **Retrieve Current State**: Fetch the `AllocationState` record for the service from the database, which contains `lastProviderIndex`. (Defaults to `-1` if it is the first assignment).
2. **Resolve Pools**: Map the active providers for the pool from the database.
3. **Circular Scan**:
   - Let the pool size be $N$.
   - Let the search start index be $S = (lastProviderIndex + 1) \bmod N$.
   - Scan circularly from $S$ to find a provider with `remainingQuota > 0` and who has not already been assigned as a mandatory provider for this lead.
   - If a valid provider $P_k$ is found:
     - Select $P_k$.
     - Set the temporary pointer to $k$.
     - If more providers are needed, repeat the scan starting at $(k + 1) \bmod N$.
4. **Update DB Pointer**: After finding all required providers, update `lastProviderIndex` in `AllocationState` to the index of the *last successfully assigned provider*.
5. **Decrement Quotas**: Reduce each selected provider's `remainingQuota` atomically by 1.

### Example Walkthrough (Service 1)
* **Pool**: `[P2, P3, P4]` ($N = 3$)
* **Initial State**: `lastProviderIndex = -1`
* **Lead 1 arrives**:
  1. Mandatory: `P1` assigned. (Slots remaining: 2).
  2. Pool search starts at $( -1 + 1 ) \bmod 3 = 0$ (`P2`).
  3. `P2` has quota. Assigned. (Slots remaining: 1).
  4. Pool search continues at $(0 + 1) \bmod 3 = 1$ (`P3`).
  5. `P3` has quota. Assigned. (Slots remaining: 0).
  6. Final state updated to `lastProviderIndex = 1`.
  7. **Assigned**: `[P1, P2, P3]`.
* **Lead 2 arrives**:
  1. Mandatory: `P1` assigned. (Slots remaining: 2).
  2. Pool search starts at $(1 + 1) \bmod 3 = 2$ (`P4`).
  3. `P4` has quota. Assigned. (Slots remaining: 1).
  4. Pool search continues at $(2 + 1) \bmod 3 = 0$ (`P2`).
  5. `P2` has quota. Assigned. (Slots remaining: 0).
  6. Final state updated to `lastProviderIndex = 0`.
  7. **Assigned**: `[P1, P4, P2]`.
* **Lead 3 arrives**:
  1. Mandatory: `P1` assigned. (Slots remaining: 2).
  2. Pool search starts at $(0 + 1) \bmod 3 = 1$ (`P3`).
  3. `P3` has quota. Assigned.
  4. Pool search continues at `P4` (index 2). Assigned.
  5. Final state updated to `lastProviderIndex = 2`.
  6. **Assigned**: `[P1, P3, P4]`.

This round-robin sequence will continue rotating perfectly through `[P2, P3, P4]` without ever resetting or losing state during server restarts.
