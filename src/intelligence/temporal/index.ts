/** TeleDOM v4 Temporal — public barrel. */
export { ChunkStore, StateFrameBuilder } from './state-frame';
export type { StateFrame, StateChunk, StateDimension } from './state-frame';
export { ALL_DIMENSIONS } from './state-frame';
export { IndexedEventStore } from './event-store';
export type { StoreQuery, StoreIndexStats } from './event-store';
export { TemporalEngine } from './queries';
export type { DiffEntry, JoinClause, QueryBudget, TemporalQueryResult, ReconstructionCheck } from './queries';
export { BranchManager } from './branching';
export type { TemporalBranch, BranchMutation, BranchMutationKind, SimulationPolicy, BranchVerificationStatus, BranchComparison } from './branching';
