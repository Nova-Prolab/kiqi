'use server';

import { generateChapterSummary } from '@/ai/flows/generate-chapter-summary';
import type { GenerateChapterSummaryOutput } from '@/ai/flows/generate-chapter-summary';

// Helper to strip HTML tags for summary generation
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>?/gm, '');
};


export async function getChapterSummaryAction(
  chapterHtmlContent: string
): Promise<{ summary?: string; error?: string }> {
  if (!chapterHtmlContent || chapterHtmlContent.trim().length === 0) {
    return { error: 'Chapter content cannot be empty.' };
  }

  const chapterText = stripHtml(chapterHtmlContent);
  if (!chapterText || chapterText.trim().length === 0) {
    return { error: 'Extracted chapter text for summary cannot be empty.' };
  }


  try {
    const result: GenerateChapterSummaryOutput = await generateChapterSummary({ chapterText });
    return { summary: result.summary };
  } catch (error) {
    console.error('Error generating chapter summary:', error);
    if (error instanceof Error) {
        return { error: `Failed to generate summary: ${error.message}` };
    }
    return { error: 'An unexpected error occurred while generating the summary.' };
  }
}
