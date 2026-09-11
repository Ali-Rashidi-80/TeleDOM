/** TeleDOM v4 Security barrel. */
export { ZeroTrustModel } from './zero-trust';
export type { TrustLevel, OriginTrustRecord, InstructionSource, Instruction, InjectionDetection, ExfiltrationSignal, AuditEntry } from './zero-trust';
export { SecurityAnalyzers, ActiveTestGate, DEFAULT_SECURITY_POLICY } from './analyzers';
export type { SecurityFinding, SecurityPolicy, Severity, FindingStatus, SecurityPostureInput } from './analyzers';
