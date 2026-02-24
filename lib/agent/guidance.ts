import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function guidanceAgent(input: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: 'You are an expert AI assistant. Analyze the current state of the project and provide guidance on the next steps. Identify any potential issues or areas for improvement.',
    prompt: input,
  });

  return text;
}
