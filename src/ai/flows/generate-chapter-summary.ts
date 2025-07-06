
'use server';

/**
 * @fileOverview A chapter summary AI agent.
 *
 * - generateChapterSummary - A function that handles the chapter summary process.
 * - GenerateChapterSummaryInput - The input type for the generateChapterSummary function.
 * - GenerateChapterSummaryOutput - The return type for the generateChaptersummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const SummaryLengthOptions = ['breve', 'normal', 'extenso'] as const;
export const SummaryStyleOptions = ['Puntos Clave', 'Narrativo'] as const;

const GenerateChapterSummaryInputSchema = z.object({
  chapterText: z
    .string()
    .describe('The text content of the chapter to be summarized.'),
  summaryLength: z
    .enum(SummaryLengthOptions)
    .describe("La longitud deseada para el resumen."),
  summaryStyle: z
    .enum(SummaryStyleOptions)
    .describe("El estilo de escritura para el resumen."),
});
export type GenerateChapterSummaryInput = z.infer<typeof GenerateChapterSummaryInputSchema>;

const GenerateChapterSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the chapter content, in Spanish, formatted according to the provided instructions.'),
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
  prompt: `Eres un experto analista literario. Tu tarea es generar un resumen en ESPAÑOL del texto de un capítulo que se te proporcionará.

Sigue estas instrucciones para el resumen:
1.  **Longitud del Resumen:** Genera un resumen de longitud '{{summaryLength}}'.
2.  **Estilo del Resumen:** El resumen debe tener un estilo '{{summaryStyle}}'.
    - Si el estilo es 'Puntos Clave', formatea la salida como una lista de viñetas (usando '-' para cada punto) que destaque los eventos y detalles más importantes.
    - Si el estilo es 'Narrativo', escribe un resumen cohesivo en forma de párrafo(s).

Texto del Capítulo a resumir:
{{{chapterText}}}

Resumen (formateado según las instrucciones):`,
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
