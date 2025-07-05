
'use server';

import { generateChapterSummary } from '@/ai/flows/generate-chapter-summary';
import type { GenerateChapterSummaryOutput } from '@/ai/flows/generate-chapter-summary';

// Helper to strip HTML tags for summary generation
const stripHtml = (html: string): string => {
  // This is a server-side only environment now, so we can't use the DOM.
  // A simple regex is sufficient for this purpose.
  return html.replace(/<[^>]*>?/gm, '');
};


export async function getChapterSummaryAction(
  chapterHtmlContent: string
): Promise<{ summary?: string; error?: string }> {
  if (!chapterHtmlContent || chapterHtmlContent.trim().length === 0) {
    return { error: 'El contenido del capítulo no puede estar vacío.' };
  }

  const chapterText = stripHtml(chapterHtmlContent);
  if (!chapterText || chapterText.trim().length === 0) {
    return { error: 'El texto extraído para el resumen no puede estar vacío.' };
  }

  try {
    const result: GenerateChapterSummaryOutput = await generateChapterSummary({ chapterText });
    return { summary: result.summary };
  } catch (error) {
    console.error('Error generating chapter summary:', error);
    if (error instanceof Error) {
        return { error: `Falló la generación del resumen: ${error.message}` };
    }
    return { error: 'Ocurrió un error inesperado al generar el resumen.' };
  }
}
