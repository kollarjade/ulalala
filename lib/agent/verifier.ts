import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { chromium } from 'playwright';

export async function verifierAgent(input: string): Promise<string> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  const screenshot = await page.screenshot({ path: 'screenshot.png' });
  await browser.close();

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: 'You are an expert QA engineer. Review the screenshot and verify if the requested changes were implemented correctly. If not, provide a detailed bug report.',
    prompt: input,
  });

  return text;
}
