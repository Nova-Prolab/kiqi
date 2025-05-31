
'use server';

import { enhanceText } from '@/ai/flows/enhance-text-flow';
import type { EnhanceTextInput, EnhanceTextOutput } from '@/ai/flows/enhance-text-flow';

export async function enhanceTextAction(
  input: EnhanceTextInput
): Promise<{ enhancedText?: string; error?: string }> {
  if (!input.text || input.text.trim().length === 0) {
    return { error: 'El texto de entrada no puede estar vacío.' };
  }
  if (!input.enhancementType) {
    return { error: 'Se debe especificar el tipo de mejora.' };
  }

  try {
    const result: EnhanceTextOutput = await enhanceText(input);
    return { enhancedText: result.enhancedText };
  } catch (error) {
    console.error(`Error during AI enhancement (${input.enhancementType}):`, error);
    if (error instanceof Error) {
      return { error: `Falló la mejora del texto con IA: ${error.message}` };
    }
    return { error: 'Ocurrió un error inesperado durante la mejora con IA.' };
  }
}
