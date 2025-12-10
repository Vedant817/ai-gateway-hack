/* eslint-disable @typescript-eslint/no-explicit-any */
import { createOpenAI } from '@ai-sdk/openai';
import { ModelId } from '@/types/game';

const gatewayEndpoint =
  process.env.VERCEL_AI_GATEWAY_URL ||
  process.env.AI_GATEWAY_ENDPOINT ||
  'https://ai-gateway.vercel.sh/v1';

const gatewayProvider = createOpenAI({
  baseURL: gatewayEndpoint,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export const modelMap: Record<ModelId, any> = {
  'grok-code-fast-1': gatewayProvider('xai/grok-code-fast-1'),
  'grok-4-fast-reasoning': gatewayProvider('xai/grok-4-fast-reasoning'),
  'claude-sonnet-4.5': gatewayProvider('anthropic/claude-3-7-sonnet-latest'),
  'claude-haiku-4.5': gatewayProvider('anthropic/claude-3-5-haiku-latest'),
  'claude-opus-4.5': gatewayProvider('anthropic/claude-3-opus-latest'),
  'claude-3.7-sonnet': gatewayProvider('anthropic/claude-3-7-sonnet-latest'),
  'gpt-4.1-mini': gatewayProvider('openai/gpt-4.1-mini'),
  'gemini-2.5-flash-lite': gatewayProvider('google/gemini-2.5-flash-lite'),
  'gemini-2.5-flash': gatewayProvider('google/gemini-2.5-flash'),
  'gemini-3-pro-preview': gatewayProvider('google/gemini-3-pro-preview'),
};

