/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AtFileProcessor } from './atFileProcessor.js';
import { CommandContext } from '../../ui/commands/types.js';

// Mock the core dependency
vi.mock('@google/gemini-cli-core', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@google/gemini-cli-core')>();
  return {
    ...original,
    processImports: vi.fn(),
  };
});

// Must be imported after the mock
const { processImports } = await import('@google/gemini-cli-core');

describe('AtFileProcessor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should process @-file imports using project root from config', async () => {
    const processor = new AtFileProcessor();
    const prompt = 'Here is a file: @my/file.txt';
    const mockContext = {
      services: {
        config: {
          getProjectRoot: () => '/test/project/root',
        },
      },
    } as unknown as CommandContext;

    const mockResult = {
      content: 'Here is a file: content of file.txt',
      imports: {},
      importTree: { path: 'unknown' },
    };
    vi.mocked(processImports).mockResolvedValue(mockResult);

    const result = await processor.process(prompt, mockContext);

    expect(processImports).toHaveBeenCalledWith(
      prompt,
      '/test/project/root',
      false,
      undefined,
      '/test/project/root',
      'tree',
      false,
    );
    expect(result).toBe(mockResult.content);
  });

  it('should use process.cwd() if project root is not configured', async () => {
    const processor = new AtFileProcessor();
    const prompt = 'Here is a file: @my/file.txt';
    const mockContext = {
      services: {
        config: {
          getProjectRoot: () => undefined,
        },
      },
    } as unknown as CommandContext;

    const mockResult = {
      content: 'Here is a file: content of file.txt',
      imports: {},
      importTree: { path: 'unknown' },
    };
    vi.mocked(processImports).mockResolvedValue(mockResult);
    const spyCwd = vi.spyOn(process, 'cwd').mockReturnValue('/current/dir');

    const result = await processor.process(prompt, mockContext);

    expect(processImports).toHaveBeenCalledWith(
      prompt,
      '/current/dir',
      false,
      undefined,
      '/current/dir',
      'tree',
      false,
    );
    expect(result).toBe(mockResult.content);
    spyCwd.mockRestore();
  });

  it('should handle config service being undefined', async () => {
    const processor = new AtFileProcessor();
    const prompt = 'Here is a file: @my/file.txt';
    const mockContext = {
      services: {},
    } as unknown as CommandContext;

    const mockResult = {
      content: 'Here is a file: content of file.txt',
      imports: {},
      importTree: { path: 'unknown' },
    };
    vi.mocked(processImports).mockResolvedValue(mockResult);
    const spyCwd = vi.spyOn(process, 'cwd').mockReturnValue('/current/dir');

    const result = await processor.process(prompt, mockContext);

    expect(processImports).toHaveBeenCalledWith(
      prompt,
      '/current/dir',
      false,
      undefined,
      '/current/dir',
      'tree',
      false,
    );
    expect(result).toBe(mockResult.content);
    spyCwd.mockRestore();
  });

  it('should return the processed content', async () => {
    const processor = new AtFileProcessor();
    const prompt = 'initial prompt';
    const mockContext = {
      services: {
        config: {
          getProjectRoot: () => '/test/project/root',
        },
      },
    } as unknown as CommandContext;

    const mockResult = {
      content: 'processed prompt content',
      imports: {},
      importTree: { path: 'unknown' },
    };
    vi.mocked(processImports).mockResolvedValue(mockResult);

    const result = await processor.process(prompt, mockContext);

    expect(result).toBe('processed prompt content');
  });
});
