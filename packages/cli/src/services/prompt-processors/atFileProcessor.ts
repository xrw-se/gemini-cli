/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { IPromptProcessor } from './types.js';
import { CommandContext } from '../../ui/commands/types.js';
import { processImports } from '@google/gemini-cli-core';

export class AtFileProcessor implements IPromptProcessor {
  async process(prompt: string, context: CommandContext): Promise<string> {
    const projectRoot =
      context.services.config?.getProjectRoot() || process.cwd();

    // Call the existing, robust processImports function, using the project
    // root as the base path for resolving @-file paths.
    const result = await processImports(
      prompt,
      projectRoot, // Use project root as the base for resolving paths
      false, // debugMode
      undefined, // default importState
      projectRoot,
      'tree', // 'tree' format injects content directly
      false, // <--- Disable recursion for TOML commands
    );

    return result.content;
  }
}
