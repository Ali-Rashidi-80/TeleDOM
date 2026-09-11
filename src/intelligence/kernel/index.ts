/** TeleDOM v4 Kernel — public barrel. */
export { HybridClock } from './clock';
export type { ClockSample } from './clock';
export { EventMesh, EVENT_SCHEMA_VERSION } from './events';
export type { EventEnvelope, EventSource, EventIntegrityMeta, EventMeshOptions } from './events';
export { HashChain, computeHash, chainHash, canonicalJson } from './integrity';
export { IdentityEngine } from './identity';
export type { TemporalEntity, EntityType, EntityVersion, IdentityMatchResult } from './identity';
export { KernelDiagnostics } from './lifecycle';
export type { HealthCheck, HealthSnapshot, HealthStatus } from './lifecycle';
