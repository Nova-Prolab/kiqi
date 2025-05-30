
'use server';

import { translateChapter } from '@/ai/flows/translate-chapter-flow';
import type { TranslateChapterInput, TranslateChapterOutput } from '@/ai/flows/translate-chapter-flow';

export async function translateChapterAction(
  chapterHtmlContent: string,
  targetLanguage: TranslateChapterInput['targetLanguage']
): Promise<{ translatedContent?: string; error?: string }> {
  if (!chapterHtmlContent || chapterHtmlContent.trim().length === 0) {
    return { error: 'Chapter content cannot be empty.' };
  }
  if (!targetLanguage) {
    return { error: 'Target language must be specified.' };
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
      return { error: `Failed to translate chapter: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while translating the chapter.' };
  }
}
