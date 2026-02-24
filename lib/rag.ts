import { openai } from '@ai-sdk/openai';
import { generateText, embed } from 'ai';
import { prisma } from './auth';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });

  return embedding;
}

export async function searchSimilar(embedding: number[], limit: number = 5): Promise<any[]> {
  const result = await prisma.$queryRaw\`
    SELECT id, fileIndexId, contentSnippet, 1 - (embedding <=> \${embedding}::vector) AS similarity
    FROM vector_embeddings
    ORDER BY embedding <=> \${embedding}::vector
    LIMIT \${limit}
  \`;

  return result as any[];
}
