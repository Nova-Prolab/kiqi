
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
export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';

export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  isImmersive: boolean; // Added immersive mode state
}
