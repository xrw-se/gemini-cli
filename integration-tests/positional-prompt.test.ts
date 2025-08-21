/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { TestRig } from './test-helper.js';
import { expect, describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

describe('positional-prompt', () => {
  let rig: TestRig;

  beforeAll(() => {
    rig = new TestRig();
  });

  beforeEach(async () => {
    await rig.setup('positional-prompt-tests');
  });

  afterAll(async () => {
    await rig.cleanup();
  });

  const assertLastPrompt = (expectedPrompt: string) => {
    const lastRequest = rig.readLastApiRequest();
    expect(lastRequest).not.toBeNull();
    const requestPayload = JSON.parse(
      lastRequest!.attributes!['request'] as string,
    );
    const lastPrompt = requestPayload.contents[0].parts[0].text.trim();
    expect(lastPrompt).toBe(expectedPrompt);
  };

  it('should handle a simple positional prompt', async () => {
    const prompt = 'tell me a joke';
    await rig.run(undefined, prompt);
    assertLastPrompt(prompt);
  });

  it('should handle positional prompt with a flag before it', async () => {
    const prompt = 'tell me a joke';
    await rig.run(undefined, '--model', 'foo', prompt);
    assertLastPrompt(prompt);
  });

  it('should handle positional prompt interleaved with a flag', async () => {
    const prompt = 'tell me a joke';
    await rig.run(undefined, 'tell', 'me', '--model', 'foo', 'a', 'joke');
    assertLastPrompt(prompt);
  });

  it('should combine --prompt with a positional prompt', async () => {
    const promptPart1 = 'tell me';
    const promptPart2 = 'a joke';
    await rig.run({ prompt: promptPart1 }, promptPart2);
    assertLastPrompt(`${promptPart1} ${promptPart2}`);
  });

  it('should handle piping STDIN with a positional prompt', async () => {
    const stdinText = 'tell me';
    const positionalText = 'a joke';
    await rig.run({ stdin: stdinText }, positionalText);
    assertLastPrompt(`${stdinText}\n\n${positionalText}`);
  });

  it('should handle piping STDIN with --prompt and a positional prompt', async () => {
    const stdinText = 'tell me';
    const promptText = 'a joke';
    const positionalText = 'about a robot';
    await rig.run({ stdin: stdinText, prompt: promptText }, positionalText);
    assertLastPrompt(`${stdinText}\n\n${promptText} ${positionalText}`);
  });
});
