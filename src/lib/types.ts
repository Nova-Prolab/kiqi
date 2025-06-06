
export interface Chapter {
  id: string; // e.g., "chapter-1"
  title: string;
  order: number;
  content: string;
  path?: string;
}

export const AGE_RATING_VALUES = ['all', 'pg', 'teen', 'mature', 'adults'] as const;
export type AgeRating = typeof AGE_RATING_VALUES[number];

export const STATUS_VALUES = ['ongoing', 'completed', 'hiatus', 'dropped'] as const;
export type NovelStatus = typeof STATUS_VALUES[number];

export interface InfoJson {
  titulo: string;
  descripcion: string;
  autor: string;
  coverImageUrl?: string;
  ageRating?: AgeRating;
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;
  creatorId?: string; // Unique ID of the user who created the novel
  rating_platform?: number; // 0-5, site's own rating
  status?: NovelStatus; // e.g., 'completed', 'ongoing'
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
  ageRating?: AgeRating;
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  traductor?: string;
  lastUpdateDate?: string; // This will be populated by fecha_lanzamiento
  creatorId?: string; // Unique ID of the user who created the novel
  rating_platform?: number;
  status?: NovelStatus;
}

// For Reader Settings Context
export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'midnight' | 'paper' | 'forest' | 'custom';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl';
export type ReaderLineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';
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
  | 'source-sans-3' 
  | 'inter'
  | 'arimo'
  | 'tinos'
  | 'cousine'
  | 'custom';

export type ReaderLetterSpacing = 'normal' | 'wide' | 'wider';
export type ReaderTextAlign = 'left' | 'justify';
export type ReaderTextWidth = 'narrow' | 'medium' | 'wide';
export type ReaderParagraphSpacing = 'default' | 'medium' | 'large';


export interface ReaderSettings {
  theme: ReaderTheme;
  fontSize: ReaderFontSize;
  lineHeight: ReaderLineHeight;
  fontFamily: ReaderFontFamily;
  isImmersive: boolean;
  customFontFamily?: string;
  customBackground?: string;
  customForeground?: string;
  letterSpacing: ReaderLetterSpacing;
  textAlign: ReaderTextAlign;
  textWidth: ReaderTextWidth;
  paragraphSpacing: ReaderParagraphSpacing;
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
  creatorId: string; // User's unique ID - now mandatory
  ageRating: AgeRating;
  rating_platform?: number;
  status?: NovelStatus;
}

// For User "Accounts"
export interface User {
  id: string; // Unique user ID
  username: string;
  email: string;
  password?: string; // Storing password in plain text - UNSAFE FOR PRODUCTION
}

// For Chapter Management
export interface SaveChapterInput {
    novelId: string;
    chapterNumber: number;
    chapterTitle?: string;
    chapterContent: string;
}

export interface ChapterUploadState {
  message: string;
  success: boolean;
  uploadedFiles?: { name: string; status: 'success' | 'error'; reason?: string }[];
  failedFiles?: { name: string; status: 'error'; reason?: string }[];
}

// For AI Translation Flow
export const TARGET_LANGUAGES = [
  "English",
  "Portuguese",
  "French",
  "Italian",
  "German",
  "Japanese",
  "Korean",
  "Chinese (Simplified)"
] as const;

export type TargetLanguage = typeof TARGET_LANGUAGES[number];
