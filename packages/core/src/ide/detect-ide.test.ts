/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { DetectedIde, detectIde } from './detect-ide.js';

vi.mock('node:os', () => ({
  default: {
    platform: vi.fn(),
  },
}));

describe('detectIde', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('TERM_PROGRAM', 'vscode');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns Devin when __COG_BASHRC_SOURCED is set', () => {
    vi.stubEnv('__COG_BASHRC_SOURCED', '1');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(DetectedIde.Devin);
  });

  it('returns Replit when REPLIT_USER is set', () => {
    vi.stubEnv('REPLIT_USER', 'test');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(DetectedIde.Replit);
  });

  it('returns Cursor when CURSOR_TRACE_ID is set', () => {
    vi.stubEnv('CURSOR_TRACE_ID', 'test');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(DetectedIde.Cursor);
  });

  it('returns Codespaces when CODESPACES is true', () => {
    vi.stubEnv('CODESPACES', 'true');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(
      DetectedIde.Codespaces,
    );
  });

  it('returns CloudShell when EDITOR_IN_CLOUD_SHELL is true', () => {
    vi.stubEnv('EDITOR_IN_CLOUD_SHELL', 'true');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(
      DetectedIde.CloudShell,
    );
  });

  it('returns CloudShell when CLOUD_SHELL is true', () => {
    vi.stubEnv('CLOUD_SHELL', 'true');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(
      DetectedIde.CloudShell,
    );
  });

  it('returns Trae when TERM_PRODUCT is Trae', () => {
    vi.stubEnv('TERM_PRODUCT', 'Trae');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(DetectedIde.Trae);
  });

  it('returns FirebaseStudio when FIREBASE_DEPLOY_AGENT is true', () => {
    vi.stubEnv('FIREBASE_DEPLOY_AGENT', 'true');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(
      DetectedIde.FirebaseStudio,
    );
  });

  it('returns FirebaseStudio when MONOSPACE_ENV is set', () => {
    vi.stubEnv('MONOSPACE_ENV', 'true');
    expect(detectIde({ pid: 123, command: 'any' })).toBe(
      DetectedIde.FirebaseStudio,
    );
  });

  it('returns VSCode when command contains "code"', () => {
    expect(detectIde({ pid: 123, command: '/usr/bin/code' })).toBe(
      DetectedIde.VSCode,
    );
  });

  it('returns VSCodeFork when command does not contain "code"', () => {
    expect(detectIde({ pid: 123, command: '/usr/bin/vscodium' })).toBe(
      DetectedIde.VSCodeFork,
    );
  });

  it('returns undefined for non-vscode', () => {
    vi.unstubAllEnvs();
    vi.stubEnv('TERM_PROGRAM', 'definitely-not-vscode');
    expect(detectIde({ pid: 123, command: 'code' })).toBeUndefined();
  });
});
