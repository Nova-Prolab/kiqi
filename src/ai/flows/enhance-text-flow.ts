
'use server';
/**
 * @fileOverview An AI writing assistant flow to enhance chapter text.
 *
 * - enhanceText - A function that handles various text enhancement tasks.
 * - EnhanceTextInput - The input type for the enhanceText function.
 * - EnhanceTextOutput - The return type for the enhanceText function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const EnhancementTypeSchema = z.enum([
  'suggestDialogue',
  'suggestPlotIdea',
  'correctGrammar',
  'summarizeSection',
]);
export type EnhancementType = z.infer<typeof EnhancementTypeSchema>;

export const EnhanceTextInputSchema = z.object({
  text: z.string().describe('The text to be enhanced or used as context.'),
  enhancementType: EnhancementTypeSchema.describe(
    'The type of enhancement to perform.'
  ),
});
export type EnhanceTextInput = z.infer<typeof EnhanceTextInputSchema>;

export const EnhanceTextOutputSchema = z.object({
  enhancedText: z
    .string()
    .describe('The resulting text after enhancement.'),
});
export type EnhanceTextOutput = z.infer<typeof EnhanceTextOutputSchema>;

export async function enhanceText(
  input: EnhanceTextInput
): Promise<EnhanceTextOutput> {
  return enhanceTextFlow(input);
}

// Define different prompt instructions based on enhancementType
const getPromptInstructions = (type: EnhancementType) => {
  switch (type) {
    case 'suggestDialogue':
      return "Dada la siguiente sección de un capítulo de una novela: '{{{text}}}'. Sugiere un diálogo breve, conciso y relevante que podría seguir o insertarse aquí. El diálogo debe estar en español. Devuelve solo el diálogo sugerido.";
    case 'suggestPlotIdea':
      return "Basándote en el siguiente texto de un capítulo de una novela: '{{{text}}}'. Sugiere una idea de trama interesante, un posible giro argumental o el siguiente desarrollo de la escena. La idea debe ser concisa y estar en español. Proporciona solo la sugerencia de la trama.";
    case 'correctGrammar':
      return "Revisa y corrige la gramática y ortografía del siguiente texto en español, manteniendo el significado original. Si el texto contiene etiquetas HTML, presérvalas tanto como sea posible. Devuelve solo el texto corregido: '{{{text}}}'.";
    case 'summarizeSection':
      return "Resume brevemente la siguiente sección de texto en español, en no más de tres frases: '{{{text}}}'. Proporciona solo el resumen.";
    default:
      return 'Por favor, procesa el siguiente texto: {{{text}}}';
  }
};

const enhanceTextFlow = ai.defineFlow(
  {
    name: 'enhanceTextFlow',
    inputSchema: EnhanceTextInputSchema,
    outputSchema: EnhanceTextOutputSchema,
  },
  async (input) => {
    const promptInstructions = getPromptInstructions(input.enhancementType);

    const dynamicPrompt = ai.definePrompt({
        name: `enhanceTextPrompt_${input.enhancementType}`, // Unique name for prompt instance
        input: { schema: EnhanceTextInputSchema },
        output: { schema: EnhanceTextOutputSchema },
        prompt: promptInstructions,
      });

    const { output } = await dynamicPrompt(input);
    if (!output || !output.enhancedText) {
      throw new Error('La IA no pudo generar una respuesta.');
    }
    return output;
  }
);
