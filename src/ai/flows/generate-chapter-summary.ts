'use server';

/**
 * @fileOverview A chapter summary AI agent.
 *
 * - generateChapterSummary - A function that handles the chapter summary process.
 * - GenerateChapterSummaryInput - The input type for the generateChapterSummary function.
 * - GenerateChapterSummaryOutput - The return type for the generateChapterSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateChapterSummaryInputSchema = z.object({
  chapterText: z
    .string()
    .describe('The text content of the chapter to be summarized.'),
});
export type GenerateChapterSummaryInput = z.infer<typeof GenerateChapterSummaryInputSchema>;

const GenerateChapterSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chapter content.'),
});
export type GenerateChapterSummaryOutput = z.infer<typeof GenerateChapterSummaryOutputSchema>;

export async function generateChapterSummary(
  input: GenerateChapterSummaryInput
): Promise<GenerateChapterSummaryOutput> {
  return generateChapterSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChapterSummaryPrompt',
  input: {schema: GenerateChapterSummaryInputSchema},
  output: {schema: GenerateChapterSummaryOutputSchema},
  prompt: `You are an expert literary analyst. Please provide a concise summary of the following chapter text:\n\n{{{chapterText}}}`,
});

const generateChapterSummaryFlow = ai.defineFlow(
  {
    name: 'generateChapterSummaryFlow',
    inputSchema: GenerateChapterSummaryInputSchema,
    outputSchema: GenerateChapterSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
