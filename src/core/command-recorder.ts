import { CommandSequenceResult, CommandSequenceStep, CommandSequenceStepResult, CommandRecording } from '../types/browser-control';

/**
 * §22 / §23 Command Sequence Engine + Command Recorder
 *
 * First-class command execution with:
 *   - sequential execution
 *   - conditional continuation
 *   - explicit stop-on-error
 *   - optional continue-on-error (safe opt-in)
 *   - full before/after + duration + error records per command
 *
 * The recorder persists structured, deterministic command data so another
 * Agent can understand what happened and replay it.
 */

export type CommandExecutor = (tool: string, args: Record<string, any> | undefined) => Promise<{ success: boolean; result?: any; error?: string; summary: string }>;

export class CommandSequenceEngine {
  private sequenceCounter = 0;

  public async execute(
    steps: CommandSequenceStep[],
    executor: CommandExecutor,
    options: { stopOnError?: boolean } = {}
  ): Promise<CommandSequenceResult> {
    const stopOnError = options.stopOnError ?? true;
    this.sequenceCounter++;
    const sequenceId = `seq_${Date.now().toString(36)}_${this.sequenceCounter}`;
    const start = Date.now();

    const results: CommandSequenceStepResult[] = [];
    let previousSucceeded = true;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepStart = Date.now();

      // Conditional continuation: skip when the condition is not met
      if (step.condition?.previousStepSucceeded === false && previousSucceeded) {
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: 'SKIPPED',
          durationMs: 0,
          resultSummary: 'Skipped: condition required previous step to FAIL, but it succeeded.',
        });
        continue;
      }
      if (step.condition?.previousStepSucceeded === true && !previousSucceeded) {
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: 'SKIPPED',
          durationMs: 0,
          resultSummary: 'Skipped: condition required previous step to SUCCEED, but it failed.',
        });
        continue;
      }

      try {
        const outcome = await executor(step.tool, step.args);
        previousSucceeded = outcome.success;
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: outcome.success ? 'SUCCESS' : 'FAILED',
          durationMs: Date.now() - stepStart,
          resultSummary: outcome.summary,
          result: outcome.result,
          error: outcome.error,
        });
        if (!outcome.success && (step.stopOnError ?? stopOnError) && !(step.continueOnError)) {
          // Remaining steps are marked skipped with the reason
          for (let j = i + 1; j < steps.length; j++) {
            results.push({
              stepIndex: j,
              commandId: steps[j].commandId || `step_${j + 1}`,
              tool: steps[j].tool,
              args: steps[j].args || {},
              status: 'SKIPPED',
              durationMs: 0,
              resultSummary: 'Skipped: sequence stopped on error (stopOnError).',
            });
          }
          break;
        }
      } catch (err: any) {
        previousSucceeded = false;
        results.push({
          stepIndex: i,
          commandId: step.commandId || `step_${i + 1}`,
          tool: step.tool,
          args: step.args || {},
          status: 'FAILED',
          durationMs: Date.now() - stepStart,
          resultSummary: 'Executor threw an exception.',
          error: err.message,
        });
        if (stopOnError && !step.continueOnError) {
          for (let j = i + 1; j < steps.length; j++) {
            results.push({
              stepIndex: j,
              commandId: steps[j].commandId || `step_${j + 1}`,
              tool: steps[j].tool,
              args: steps[j].args || {},
              status: 'SKIPPED',
              durationMs: 0,
              resultSummary: 'Skipped: sequence stopped on exception (stopOnError).',
            });
          }
          break;
        }
      }
    }

    const executed = results.filter((r) => r.status !== 'SKIPPED').length;
    const skipped = results.length - executed;
    return {
      sequenceId,
      success: results.every((r) => r.status !== 'FAILED'),
      totalSteps: steps.length,
      executedSteps: executed,
      skippedSteps: skipped,
      durationMs: Date.now() - start,
      stopOnError,
      steps: results,
    };
  }
}

/**
 * §23 Command Recorder — records actual tool invocations into replayable,
 * persisted, structured data with save/load/rename/duplicate/edit/replay/
 * inspect/export operations.
 */
export class CommandRecorder {
  private recording: CommandRecording | null = null;
  private counter = 0;

  public start(name: string, description?: string, tags: string[] = []): CommandRecording {
    this.counter++;
    this.recording = {
      recordingId: `rec_${Date.now().toString(36)}_${this.counter}`,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commandCount: 0,
      commands: [],
      tags,
    };
    return this.recording;
  }

  public isRecording(): boolean {
    return this.recording !== null;
  }

  public getActiveRecording(): CommandRecording | null {
    return this.recording;
  }

  public recordCommand(tool: string, args: Record<string, any> | undefined, outcome: 'SUCCESS' | 'FAILED', resultSummary?: string): void {
    if (!this.recording) return;
    this.recording.commands.push({
      index: this.recording.commands.length + 1,
      commandId: `rcmd_${this.recording.commands.length + 1}_${Date.now().toString(36)}`,
      tool,
      args,
      recordedAt: Date.now(),
      outcome,
      resultSummary,
    });
    this.recording.commandCount = this.recording.commands.length;
    this.recording.updatedAt = Date.now();
  }

  public stop(): CommandRecording | null {
    const finished = this.recording;
    this.recording = null;
    return finished;
  }

  public cancel(): void {
    this.recording = null;
  }

  // --- Editing operations on recordings ------------------------------
  public static rename(recording: CommandRecording, name: string): CommandRecording {
    return { ...recording, name, updatedAt: Date.now() };
  }

  public static duplicate(recording: CommandRecording): CommandRecording {
    return {
      ...recording,
      recordingId: `rec_${Date.now().toString(36)}_copy`,
      name: `${recording.name}_copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      commands: recording.commands.map((c, i) => ({ ...c, index: i + 1, commandId: `rcmd_${i + 1}_${Date.now().toString(36)}` })),
    };
  }

  public static editCommand(recording: CommandRecording, index: number, updates: { tool?: string; args?: Record<string, any> }): CommandRecording {
    const commands = recording.commands.map((c) =>
      c.index === index ? { ...c, tool: updates.tool || c.tool, args: updates.args ?? c.args } : c
    );
    return { ...recording, commands, commandCount: commands.length, updatedAt: Date.now() };
  }

  public static removeCommand(recording: CommandRecording, index: number): CommandRecording {
    const commands = recording.commands.filter((c) => c.index !== index).map((c, i) => ({ ...c, index: i + 1 }));
    return { ...recording, commands, commandCount: commands.length, updatedAt: Date.now() };
  }
}
