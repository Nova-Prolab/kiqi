export interface Chapter {
  id: string;
  title: string;
  order: number;
  content: string; // Full chapter content, expected to be HTML string
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  summary: string;
  githubRepoUrl?: string; // Optional: URL to the GitHub folder for this novel
  chapters: Chapter[]; // Array of full chapter objects
}

// For Reader Settings Context
export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
}
