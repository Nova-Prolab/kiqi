'use server';
/**
 * @fileOverview A chapter translation AI agent.
 *
 * - translateChapter - A function that handles the chapter translation process.
 * - TranslateChapterInput - The input type for the translateChapter function.
 * - TranslateChapterOutput - The return type for the translateChapter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { TargetLanguage } from '@/lib/types'; // Still useful for function signature type safety

// Define the languages locally for z.enum and describe to avoid issues with 'use server' and imported objects in schemas
const localTargetLanguagesList = [
  "English",
  "Portuguese",
  "French",
  "Italian",
  "German",
  "Japanese",
  "Korean",
  "Chinese (Simplified)"
] as const;

const TranslateChapterInputSchema = z.object({
  chapterHtmlContent: z
    .string()
    .describe('The HTML content of the chapter to be translated.'),
  targetLanguage: z.enum(localTargetLanguagesList) // Use the local list here
    .describe(`The target language for translation. Supported languages are: ${localTargetLanguagesList.join(', ')}.`),
});
export type TranslateChapterInput = z.infer<typeof TranslateChapterInputSchema>;

const TranslateChapterOutputSchema = z.object({
  translatedHtmlContent: z.string().describe('The translated HTML content of the chapter.'),
});
export type TranslateChapterOutput = z.infer<typeof TranslateChapterOutputSchema>;

export async function translateChapter(
  input: TranslateChapterInput
): Promise<TranslateChapterOutput> {
  return translateChapterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateChapterPrompt',
  input: {schema: TranslateChapterInputSchema},
  output: {schema: TranslateChapterOutputSchema},
  prompt: `You are an expert translator specializing in literary works.
Translate the following HTML chapter content into {{{targetLanguage}}}.
It is crucial that you preserve the HTML tags and structure as accurately as possible.
Only translate the text content within the HTML elements. Do not translate HTML tag names or attributes.

Original HTML Content:
{{{chapterHtmlContent}}}

Please provide the translated HTML content.`,
});

const translateChapterFlow = ai.defineFlow(
  {
    name: 'translateChapterFlow',
    inputSchema: TranslateChapterInputSchema,
    outputSchema: TranslateChapterOutputSchema,
  },
  async (input) => { // Explicitly type flowInput if needed, inferred here
    // Consider adding safety settings if needed for specific content
    // config: {
    //   safetySettings: [
    //     { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    //   ],
    // },
    const {output} = await prompt(input);
    if (!output || typeof output.translatedHtmlContent === 'undefined') {
        console.error('AI translation failed. Input:', input, 'Raw AI Output:', output);
        throw new Error('La IA no pudo generar una traducción o la respuesta fue inválida.');
    }
    return output;
  }
);
