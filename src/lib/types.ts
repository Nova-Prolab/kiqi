
export interface Chapter {
  id: string; // e.g., "chapter-1"
  title: string; // e.g., "Chapter 1" (can be generated)
  order: number;
  content: string; // Full chapter content, expected to be HTML string
  path?: string; // Path to the chapter file in the repo, e.g. "el-magnate/chapter-1.html"
}

export interface InfoJson {
  titulo: string;
  descripcion: string;
  autor: string;
  coverImageUrl?: string;
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  summary: string;
  githubRepoUrl?: string;
  chapters: Pick<Chapter, 'id' | 'title' | 'order'>[];

  // Fields from info.json
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;
  lastUpdateDate?: string;
}

// For Reader Settings Context
export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'midnight' | 'paper' | 'forest' | 'custom';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type ReaderFontFamily = 
  | 'system-serif' 
  | 'system-sans' 
  | 'lora' 
  | 'merriweather' 
  | 'noto-serif' 
  | 'pt-serif' 
  | 'eb-garamond'
  | 'vollkorn'
  | 'bitter'
  | 'open-sans'
  | 'lato'
  | 'roboto'
  | 'source-sans-pro'
  | 'inter'
  | 'custom';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  isImmersive: boolean;
  customBackground?: string;
  customForeground?: string;
  fontFamily: ReaderFontFamily;
  customFontFamily?: string;
}

// For Recently Read Chapters
export interface RecentChapterInfo {
  id: string; // chapter id e.g. "chapter-1"
  title: string; // chapter title
  order: number; // chapter order
  novelId: string; 
  novelTitle: string; 
  timestamp: number; // For sorting by recency
}

export interface StoredRecentlyReadData {
  [novelId: string]: RecentChapterInfo[];
}

// For Create Novel Form
export interface CreateNovelInput {
  title: string;
  author: string;
  description: string;
  coverImageUrl?: string;
  category?: string;
  tags?: string; // Comma-separated string
  translator?: string;
  releaseDate?: string;
}
