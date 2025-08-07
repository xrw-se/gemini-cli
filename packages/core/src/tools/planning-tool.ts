/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseTool, Icon, ToolResult } from './tools.js';
import { Schema, Type } from '@google/genai';
import { Config } from '../config/config.js';
import {
  ContextState,
  ModelConfig,
  OutputConfig,
  PromptConfig,
  RunConfig,
  SubAgentScope,
  SubagentTerminateMode,
} from '../core/subagent.js';

const planningToolName = 'planning_tool';

const PLANNING_SYSTEM_PROMPT = `
You are an expert planning assistant. Your purpose is to take a user's request and decompose it into a detailed, step-by-step execution plan. This plan will be executed by another AI agent, so it must be precise and unambiguous.

Analyze the user's request carefully and create a plan as a JSON object. The plan should be a list of discrete, actionable tasks. For each task, provide a clear and concise description of what needs to be done.

Here is the user's request:
\${user_request}
`;

const promptConfig: PromptConfig = {
  systemPrompt: PLANNING_SYSTEM_PROMPT,
};

const modelConfig: ModelConfig = {
  model: 'gemini-2.5-pro',
  temp: 0.1,
  top_p: 0.95,
};

const runConfig: RunConfig = {
  max_time_minutes: 3,
  max_turns: 8,
};

const outputConfig: OutputConfig = {
  outputs: {
    execution_plan:
      'A JSON string representing the detailed, step-by-step execution plan.',
  },
};

const PlanningToolSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    user_request: {
      type: Type.STRING,
      description: 'The high-level user request to be planned.',
    },
  },
  required: ['user_request'],
};

class PlanningTool extends BaseTool<{ user_request: string }> {
  constructor(private readonly runtimeContext: Config) {
    super(
      planningToolName,
      'Planning Tool',
      'Generates a detailed, step-by-step execution plan from a high-level user request. Use this tool to break down complex tasks into a series of smaller, manageable steps.',
      Icon.LightBulb,
      PlanningToolSchema,
      true, // isOutputMarkdown
      true, // canUpdateOutput
    );
  }

  async execute(
    params: { user_request: string },
    signal: AbortSignal,
    updateOutput?: (output: string) => void,
  ): Promise<ToolResult> {
    const plan = await this.createPlan(params.user_request, updateOutput);
    const failureMessage = 'Failed to create a plan.';

    if (!plan) {
      return {
        llmContent: [
          {
            functionResponse: {
              name: planningToolName,
              response: { success: false, error: failureMessage },
            },
          },
        ],
        returnDisplay: failureMessage,
      };
    }

    try {
      // For display, format the JSON nicely.
      const parsedPlan = JSON.parse(plan);
      const formattedPlan = JSON.stringify(parsedPlan, null, 2);
      return {
        // For the model, send the raw plan.
        llmContent: [
          {
            functionResponse: {
              name: planningToolName,
              response: { success: true, plan: parsedPlan },
            },
          },
        ],
        returnDisplay: formattedPlan,
      };
    } catch (error) {
      // If parsing fails, it's not a JSON plan. Return as is.
      console.error('Planning tool did not return valid JSON:', error);
      return {
        llmContent: [
          {
            functionResponse: {
              name: planningToolName,
              response: { success: false, error: 'Invalid JSON response' },
            },
          },
        ],
        returnDisplay: plan,
      };
    }
  }

  private async createPlan(
    userRequest: string,
    onMessage?: (message: string) => void,
  ): Promise<string | null> {
    try {
      const plannerAgent = await SubAgentScope.create(
        'planning-subagent',
        this.runtimeContext,
        promptConfig,
        modelConfig,
        runConfig,
        { outputConfig, onMessage },
      );

      const context = new ContextState();
      context.set('user_request', userRequest);

      await plannerAgent.runNonInteractive(context);

      if (plannerAgent.output.terminate_reason === SubagentTerminateMode.GOAL) {
        return plannerAgent.output.emitted_vars['execution_plan'] || null;
      }

      console.error(
        `Planning sub-agent terminated unexpectedly with reason: ${plannerAgent.output.terminate_reason}`,
      );
      return null;
    } catch (error) {
      console.error('An error occurred while running the PlanningTool:', error);
      return null;
    }
  }
}

export function getPlanningTool(
  runtimeContext: Config,
): BaseTool<{ user_request: string }> {
  return new PlanningTool(runtimeContext);
}
