
import type { Novel, Chapter, InfoJson } from './types'; // Added InfoJson import

const GITHUB_API_BASE = 'https://api.github.com';
const DEFAULT_BRANCH = 'main'; 

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: 'base64';
}

async function fetchFromGitHub<T>(path: string): Promise<T> {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    console.error('[GitHub Lib] GitHub PAT, owner, or repo not configured in environment variables.');
    throw new Error('GitHub environment variables not set.');
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  const headers: HeadersInit = {
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
  };

  // Forcing no-cache for development/debugging, revert or adjust for production
  const response = await fetch(url, { headers, cache: 'no-store' }); 

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error(`[GitHub Lib] GitHub API error for ${url}: ${response.status} - ${errorData.message}`);
    throw new Error(`Failed to fetch from GitHub: ${errorData.message || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchFileContent(filePath: string): Promise<string> {
  const fileData = await fetchFromGitHub<GitHubFile>(`contents/${filePath}?ref=${DEFAULT_BRANCH}`);
  if (fileData.type !== 'file' || !fileData.content || fileData.encoding !== 'base64') {
    throw new Error(`[GitHub Lib] Could not fetch content for file: ${filePath}. Expected base64 encoded file content.`);
  }
  return Buffer.from(fileData.content, 'base64').toString('utf-8');
}

function getRawContentUrl(filePath: string): string {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${DEFAULT_BRANCH}/${filePath}`;
}

function countWordsInHtml(htmlContent: string): number {
  if (!htmlContent) return 0;
  const textContent = htmlContent.replace(/<[^>]*>?/gm, '');
  const words = textContent.trim().replace(/\s+/g, ' ').split(' ');
  return words.filter(word => word.length > 0).length;
}

export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!owner || !repoName) {
    console.error('[GitHub Lib] GITHUB_REPO_OWNER or GITHUB_REPO_NAME not set.');
    return [];
  }

  const rootContents = await fetchFromGitHub<GitHubFile[]>('contents/');
  const novelDirs = rootContents.filter(item => item.type === 'dir' && !item.name.startsWith('.'));
  
  const novels: Novel[] = [];

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      
      const novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`);
      
      const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
      if (!infoJsonFile) {
        console.warn(`[GitHub Lib] Skipping novel '${novelId}': info.json not found at path '${novelPath}/info.json'.`);
        continue;
      }

      const infoJsonContent = await fetchFileContent(infoJsonFile.path);
      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}`);
        console.error(`[GitHub Lib] Content of problematic info.json for ${novelId}:\n---\n${infoJsonContent}\n---`);
        console.warn(`[GitHub Lib] Skipping novel '${novelId}' due to invalid info.json.`);
        continue; 
      }

      const coverImageFile = novelContents.find(f => f.name === 'cover.png' && f.type === 'file'); 
      let coverImage: string;
      if (coverImageFile) {
        coverImage = getRawContentUrl(coverImageFile.path);
        console.log(`[GitHub Lib] Novel '${novelId}': Found 'cover.png' at path '${coverImageFile.path}'. Generated URL: ${coverImage}`);
      } else {
        coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
        console.warn(`[GitHub Lib] Novel '${novelId}': 'cover.png' NOT found directly in folder '${novelPath}'. Searched for path: '${novelPath}/cover.png'. Using placeholder.`);
      }
      
      const chapterFiles = novelContents
        .filter(f => f.type === 'file' && f.name.startsWith('chapter-') && f.name.endsWith('.html'))
        .sort((a, b) => {
          const orderA = parseInt(a.name.match(/chapter-(\d+)\.html$/)?.[1] || '0');
          const orderB = parseInt(b.name.match(/chapter-(\d+)\.html$/)?.[1] || '0');
          return orderA - orderB;
        });

      const chaptersMetadata: Pick<Chapter, 'id' | 'title' | 'order'>[] = chapterFiles.map(file => {
        const orderMatch = file.name.match(/chapter-(\d+)\.html$/);
        const order = orderMatch ? parseInt(orderMatch[1]) : 0;
        return {
          id: file.name.replace('.html', ''), 
          title: `Chapter ${order}`,
          order: order,
        };
      });
      
      novels.push({
        id: novelId,
        title: info.titulo,
        author: info.autor,
        summary: info.descripcion,
        coverImage: coverImage,
        chapters: chaptersMetadata,
        fecha_lanzamiento: info.fecha_lanzamiento,
        etiquetas: info.etiquetas,
        categoria: info.categoria,
        traductor: info.traductor,
        lastUpdateDate: info.fecha_lanzamiento, // Using fecha_lanzamiento as lastUpdateDate
        // totalWordCount will be calculated in fetchNovelById if needed there
      });
    } catch (error) {
      console.error(`[GitHub Lib] Error processing novel directory '${dir.name}':`, error);
    }
  }
  return novels;
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!owner || !repoName) {
    console.error('[GitHub Lib] GITHUB_REPO_OWNER or GITHUB_REPO_NAME not set.');
    return undefined;
  }
  
  try {
    let novelContents: GitHubFile[];
    const novelFolderPath = id;

    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`);
    } catch (error: any) {
        if (error.message && error.message.includes('404')) {
            console.warn(`[GitHub Lib] Novel with id '${id}' not found in GitHub repository (404). Path checked: 'contents/${novelFolderPath}'`);
            return undefined;
        }
        throw error; 
    }

    const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
    if (!infoJsonFile) {
      console.warn(`[GitHub Lib] Novel '${id}': info.json not found at path '${novelFolderPath}/info.json'.`);
      return undefined;
    }

    const infoJsonContent = await fetchFileContent(infoJsonFile.path);
    let info: InfoJson;
    try {
      info = JSON.parse(infoJsonContent);
    } catch (parseError: any) {
      console.error(`[GitHub Lib] Error parsing info.json for novel '${id}' (path: '${infoJsonFile.path}'): ${parseError.message}`);
      console.error(`[GitHub Lib] Content of problematic info.json for '${id}':\n---\n${infoJsonContent}\n---`);
      return undefined;
    }

    const coverImageFile = novelContents.find(f => f.name === 'cover.png' && f.type === 'file');
    let coverImage: string;
      if (coverImageFile) {
        coverImage = getRawContentUrl(coverImageFile.path);
        console.log(`[GitHub Lib] Novel Detail '${id}': Found 'cover.png' at path '${coverImageFile.path}'. Generated URL: ${coverImage}`);
      } else {
        coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
        console.warn(`[GitHub Lib] Novel Detail '${id}': 'cover.png' NOT found directly in folder '${novelFolderPath}'. Searched for path: '${novelFolderPath}/cover.png'. Using placeholder.`);
      }

    const chapterFiles = novelContents
      .filter(f => f.type === 'file' && f.name.startsWith('chapter-') && f.name.endsWith('.html'))
      .sort((a, b) => {
        const orderA = parseInt(a.name.match(/chapter-(\d+)\.html$/)?.[1] || '0');
        const orderB = parseInt(b.name.match(/chapter-(\d+)\.html$/)?.[1] || '0');
        return orderA - orderB;
      });

    const chaptersMetadata: Pick<Chapter, 'id' | 'title' | 'order'>[] = chapterFiles.map(file => {
      const orderMatch = file.name.match(/chapter-(\d+)\.html$/);
      const order = orderMatch ? parseInt(orderMatch[1]) : 0;
      return {
        id: file.name.replace('.html', ''),
        title: `Chapter ${order}`,
        order: order,
      };
    });

    let totalWordCount = 0;
    for (const chapterMeta of chaptersMetadata) {
      try {
        const chapterFilePath = `${novelFolderPath}/${chapterMeta.id}.html`;
        const chapterContent = await fetchFileContent(chapterFilePath);
        totalWordCount += countWordsInHtml(chapterContent);
      } catch (wordCountError) {
        console.warn(`[GitHub Lib] Could not fetch or count words for chapter ${chapterMeta.id} of novel ${id}:`, wordCountError);
      }
    }

    return {
      id: id,
      title: info.titulo,
      author: info.autor,
      summary: info.descripcion,
      coverImage: coverImage,
      chapters: chaptersMetadata,
      fecha_lanzamiento: info.fecha_lanzamiento,
      etiquetas: info.etiquetas,
      categoria: info.categoria,
      traductor: info.traductor,
      lastUpdateDate: info.fecha_lanzamiento,
      totalWordCount: totalWordCount > 0 ? totalWordCount : undefined, // Only set if words were actually counted
    };

  } catch (error) {
    console.error(`[GitHub Lib] Error fetching novel by id '${id}':`, error);
    return undefined;
  }
}

export async function fetchChapter(novelId: string, chapterId: string): Promise<{ novel: Novel; chapter: Chapter } | undefined> {
  const novel = await fetchNovelById(novelId); // This will now also fetch word count for the novel, which is not ideal for chapter page but acceptable.
  if (!novel) {
    return undefined;
  }

  const chapterMeta = novel.chapters.find(c => c.id === chapterId);
  if (!chapterMeta) {
    console.warn(`[GitHub Lib] Chapter '${chapterId}' not found in metadata for novel '${novelId}'.`);
    return undefined;
  }

  try {
    const chapterFilePath = `${novelId}/${chapterId}.html`; 
    const chapterContent = await fetchFileContent(chapterFilePath);

    const fullChapter: Chapter = {
      id: chapterMeta.id,
      title: chapterMeta.title, 
      order: chapterMeta.order,
      content: chapterContent,
      path: chapterFilePath,
    };
    return { novel, chapter: fullChapter };
  } catch (error) {
    console.error(`[GitHub Lib] Error fetching chapter content for '${novelId}/${chapterId}':`, error);
    return undefined;
  }
}
