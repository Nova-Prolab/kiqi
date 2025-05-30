
export interface Chapter {
  id: string; // e.g., "chapter-1"
  title: string; // e.g., "Chapter 1" (can be generated)
  order: number;
  content: string; // Full chapter content, expected to be HTML string
  path?: string; // Path to the chapter file in the repo, e.g. "el-magnate/chapter-1.html"
}

export interface Novel {
  id: string; // Corresponds to the folder name in the GitHub repo
  title: string;
  author: string;
  coverImage: string; // URL to the cover image file
  summary: string;
  githubRepoUrl?: string; // URL to the specific novel folder on GitHub
  chapters: Pick<Chapter, 'id' | 'title' | 'order'>[]; // Array of chapter metadata

  // New fields from info.json
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;

  // Calculated fields
  totalWordCount?: number;
  lastUpdateDate?: string; // Will use fecha_lanzamiento for this
}

// For Reader Settings Context
export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
}
