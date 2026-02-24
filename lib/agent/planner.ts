import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function plannerAgent(input: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are an expert software architect and planner. Break down the user request into a detailed, step-by-step plan. Do not write code, only outline the tasks.',
    prompt: input,
  });

  return text;
}
