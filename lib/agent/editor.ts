import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function editorAgent(input: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are an expert software engineer. Write the code to implement the requested changes. Use the provided tools to read, write, and list files.',
    prompt: input,
  });

  return text;
}
