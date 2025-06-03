
'use server';

import { translateChapter } from '@/ai/flows/translate-chapter-flow';
import type { TranslateChapterInput, TranslateChapterOutput } from '@/ai/flows/translate-chapter-flow';

export async function translateChapterAction(
  chapterHtmlContent: string,
  targetLanguage: TranslateChapterInput['targetLanguage']
): Promise<{ translatedContent?: string; error?: string }> {
  if (!chapterHtmlContent || chapterHtmlContent.trim().length === 0) {
    return { error: 'El contenido del capítulo no puede estar vacío.' };
  }
  if (!targetLanguage) {
    return { error: 'Se debe especificar el idioma de destino.' };
  }

  try {
    const result: TranslateChapterOutput = await translateChapter({
      chapterHtmlContent,
      targetLanguage,
    });
    return { translatedContent: result.translatedHtmlContent };
  } catch (error) {
    console.error('Error translating chapter:', error);
    if (error instanceof Error) {
      return { error: `Falló la traducción del capítulo: ${error.message}` };
    }
    return { error: 'Ocurrió un error inesperado durante la traducción del capítulo.' };
  }
}

