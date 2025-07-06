
'use server';

import { generateAudioNarration } from '@/ai/flows/text-to-speech-flow';
import type { GenerateNarrationOutput } from '@/ai/flows/text-to-speech-flow';

// Helper to strip HTML tags for narration generation
const stripHtml = (html: string): string => {
  // This is a server-side only environment, so a simple regex is sufficient.
  // It replaces tags with spaces to avoid merging words together.
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};


export async function getAudioNarrationAction(
  chapterHtmlContent: string
): Promise<{ audioUrl?: string; error?: string }> {
  if (!chapterHtmlContent || chapterHtmlContent.trim().length === 0) {
    return { error: 'El contenido del capítulo no puede estar vacío.' };
  }

  const chapterText = stripHtml(chapterHtmlContent);
  
  if (!chapterText || chapterText.trim().length === 0) {
    return { error: 'El texto extraído para la narración no puede estar vacío.' };
  }
  
  // Limit text length to avoid overly long and expensive API calls.
  // About 25k characters is a reasonable limit for a chapter.
  const MAX_TEXT_LENGTH = 25000;
  if (chapterText.length > MAX_TEXT_LENGTH) {
     return { error: `El capítulo es demasiado largo para ser narrado (${chapterText.length} caracteres). El límite es ${MAX_TEXT_LENGTH}.` };
  }

  try {
    const result: GenerateNarrationOutput = await generateAudioNarration(chapterText);
    return { audioUrl: result.audioDataUri };
  } catch (error) {
    console.error('Error generating chapter narration:', error);
    if (error instanceof Error) {
        return { error: `Falló la generación del audio: ${error.message}` };
    }
    return { error: 'Ocurrió un error inesperado al generar el audio.' };
  }
}
