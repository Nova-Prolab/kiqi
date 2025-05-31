
'use server';

// import { generateChapterSummary } from '@/ai/flows/generate-chapter-summary'; // Commented out
import type { GenerateChapterSummaryOutput } from '@/ai/flows/generate-chapter-summary';

// Helper to strip HTML tags for summary generation
const stripHtml = (html: string): string => {
  if (typeof document === 'undefined') { // Guard for server-side
    const tempDivLike = { innerText: "", textContent: "" };
    tempDivLike.innerHTML = html; // This won't actually parse HTML on server but avoids error
    return (tempDivLike.textContent || tempDivLike.innerText || "").replace(/<[^>]*>?/gm, '');
  }
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return (tempDiv.textContent || tempDiv.innerText || "").replace(/<[^>]*>?/gm, '');
};


export async function getChapterSummaryAction(
  chapterHtmlContent: string
): Promise<{ summary?: string; error?: string }> {
  // Immediately return a "coming soon" message
  return { error: 'Función de IA (Resumen del Capítulo) no disponible. ¡Próximamente!' };
  
  // Original logic commented out:
  /*
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
  */
}
