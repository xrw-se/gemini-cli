/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ShellExecutionService } from '../packages/core/src/services/shellExecutionService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { vi } from 'vitest';

describe('ShellExecutionService programmatic integration tests with child_process', () => {
  let testDir: string;

  beforeAll(async () => {
    // Create a dedicated directory for this test suite to avoid conflicts.
    testDir = path.join(
      process.env['INTEGRATION_TEST_FILE_DIR']!,
      'shell-service-tests',
    );
    await fs.mkdir(testDir, { recursive: true });
  });

  it('should execute a simple cross-platform command (echo)', async () => {
    const command = 'echo "hello from the service"';
    const onOutputEvent = vi.fn();
    const abortController = new AbortController();

    const handle = await ShellExecutionService.execute(
      command,
      testDir,
      onOutputEvent,
      abortController.signal,
      false,
    );

    const result = await handle.result;

    expect(result.error).toBeNull();
    expect(result.exitCode).toBe(0);
    // Output can vary slightly between shells (e.g., quotes), so check for inclusion.
    expect(result.output).toContain('hello from the service');
  });

  it.runIf(process.platform === 'win32')(
    'should execute "dir" on Windows',
    async () => {
      const testFile = 'test-file-windows.txt';
      await fs.writeFile(path.join(testDir, testFile), 'windows test');

      const command = 'dir';
      const onOutputEvent = vi.fn();
      const abortController = new AbortController();

      const handle = await ShellExecutionService.execute(
        command,
        testDir,
        onOutputEvent,
        abortController.signal,
        false,
      );

      const result = await handle.result;

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain(testFile);
    },
  );

  it.skipIf(process.platform === 'win32')(
    'should execute "ls -l" on Unix',
    async () => {
      const testFile = 'test-file-unix.txt';
      await fs.writeFile(path.join(testDir, testFile), 'unix test');

      const command = 'ls -l';
      const onOutputEvent = vi.fn();
      const abortController = new AbortController();

      const handle = await ShellExecutionService.execute(
        command,
        testDir,
        onOutputEvent,
        abortController.signal,
        false,
      );

      const result = await handle.result;

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain(testFile);
    },
  );

  it('should abort a running process', async () => {
    // A command that runs for a bit. 'sleep' on unix, 'timeout' on windows.
    const command = process.platform === 'win32' ? 'timeout /t 20' : 'sleep 20';
    const onOutputEvent = vi.fn();
    const abortController = new AbortController();

    const handle = await ShellExecutionService.execute(
      command,
      testDir,
      onOutputEvent,
      abortController.signal,
      false,
    );

    // Abort shortly after starting
    setTimeout(() => abortController.abort(), 50);

    const result = await handle.result;

    // For debugging the flaky test.
    console.log('Abort test result:', result);

    expect(result.aborted).toBe(true);
    // A clean exit is exitCode 0 and no signal. If the process was truly
    // aborted, it should not have exited cleanly.
    const exitedCleanly = result.exitCode === 0 && result.signal === null;
    expect(exitedCleanly, 'Process should not have exited cleanly').toBe(false);
  });
});

describe('ShellExecutionService programmatic integration tests with node_pty', () => {
  let testDir: string;

  beforeAll(async () => {
    // Create a dedicated directory for this test suite to avoid conflicts.
    testDir = path.join(
      process.env['INTEGRATION_TEST_FILE_DIR']!,
      'shell-service-tests',
    );
    await fs.mkdir(testDir, { recursive: true });
  });

  it('should execute a simple cross-platform command (echo) with PTY', async () => {
    const command = 'echo "hello from the pty"';
    const onOutputEvent = vi.fn();
    const abortController = new AbortController();

    const handle = await ShellExecutionService.execute(
      command,
      testDir,
      onOutputEvent,
      abortController.signal,
      true, // Use PTY
    );

    const result = await handle.result;

    expect(result.error).toBeNull();
    expect(result.exitCode).toBe(0);
    // PTY output includes the command and shell prompts, so we just check for inclusion.
    expect(result.output).toContain('hello from the pty');
  });

  it.runIf(process.platform === 'win32')(
    'should execute "dir" on Windows with PTY',
    async () => {
      const testFile = 'test-file-windows-pty.txt';
      await fs.writeFile(path.join(testDir, testFile), 'windows pty test');

      const command = 'dir';
      const onOutputEvent = vi.fn();
      const abortController = new AbortController();

      const handle = await ShellExecutionService.execute(
        command,
        testDir,
        onOutputEvent,
        abortController.signal,
        true, // Use PTY
      );

      const result = await handle.result;

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain(testFile);
    },
  );

  it.skipIf(process.platform === 'win32')(
    'should execute "ls -l" on Unix with PTY',
    async () => {
      const testFile = 'test-file-unix-pty.txt';
      await fs.writeFile(path.join(testDir, testFile), 'unix pty test');

      const command = 'ls -l';
      const onOutputEvent = vi.fn();
      const abortController = new AbortController();

      const handle = await ShellExecutionService.execute(
        command,
        testDir,
        onOutputEvent,
        abortController.signal,
        true, // Use PTY
      );

      const result = await handle.result;

      expect(result.error).toBeNull();
      expect(result.exitCode).toBe(0);
      expect(result.output).toContain(testFile);
    },
  );

  it('should abort a running process with PTY', async () => {
    // A command that runs for a bit. 'sleep' on unix, 'timeout' on windows.
    const command = process.platform === 'win32' ? 'timeout /t 20' : 'sleep 20';
    const onOutputEvent = vi.fn();
    const abortController = new AbortController();

    const handle = await ShellExecutionService.execute(
      command,
      testDir,
      onOutputEvent,
      abortController.signal,
      true, // Use PTY
    );

    // Abort shortly after starting
    setTimeout(() => abortController.abort(), 50);

    const result = await handle.result;

    // For debugging the flaky test.
    console.log('Abort PTY test result:', result);

    expect(result.aborted).toBe(true);
    // A clean exit is exitCode 0 and no signal. If the process was truly
    // aborted, it should not have exited cleanly.
    const exitedCleanly = result.exitCode === 0 && result.signal === null;
    expect(exitedCleanly, 'Process should not have exited cleanly').toBe(false);
  });
});
