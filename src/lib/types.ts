
export interface Chapter {
  id: string; // e.g., "chapter-1"
  title: string;
  order: number;
  content: string;
  path?: string;
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
  creatorId?: string; // ID of the user who created the novel
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  summary: string;
  chapters: Pick<Chapter, 'id' | 'title' | 'order'>[];
  infoJsonSha?: string; // SHA of the info.json file, useful for updates/deletes

  // Fields from info.json
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;
  lastUpdateDate?: string;
  creatorId?: string; // ID of the user who created the novel
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
  fontFamily: ReaderFontFamily;
  customFontFamily?: string;
  customBackground?: string;
  customForeground?: string;
}

// For Recently Read Chapters
export interface RecentChapterInfo {
  id: string;
  title: string;
  order: number;
  novelId: string;
  novelTitle: string;
  timestamp: number;
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
  creatorId?: string; // To be passed to the action
}

// For User "Accounts"
export interface User {
  username: string;
  discordUsername: string;
}
