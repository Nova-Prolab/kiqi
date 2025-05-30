
import type { Novel, Chapter, InfoJson } from './types';

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
  content?: string; // Base64 encoded content
  encoding?: 'base64';
}

interface GitHubCommitResponse {
  content: GitHubFile | null; // null if deleting a file
  commit: {
    sha: string;
    // other commit details...
  };
}


async function fetchFromGitHub<T>(
  path: string, 
  method: 'GET' | 'PUT' = 'GET', 
  body?: Record<string, unknown>
): Promise<T> {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    const errorMsg = '[GitHub Lib] GitHub PAT, owner, or repo not configured in environment variables.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  const headers: HeadersInit = {
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (method === 'PUT' && body) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store', // No caching for GET, critical for PUT
  };

  if (method === 'PUT' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    const apiErrorMsg = `[GitHub Lib] GitHub API error for ${method} ${url}: ${response.status} - ${errorData.message || response.statusText}`;
    console.error(apiErrorMsg, 'Full error response:', errorData);
    throw new Error(`Failed to ${method === 'GET' ? 'fetch from' : 'write to'} GitHub: ${errorData.message || response.statusText}`);
  }

  if (response.status === 204 || response.status === 205) { // No Content or Reset Content
    return null as T; // Or handle as appropriate for PUT/DELETE that return no body
  }
  
  return response.json() as Promise<T>;
}

export async function createFileInRepo(filePath: string, content: string, commitMessage: string): Promise<GitHubCommitResponse> {
  const base64Content = Buffer.from(content).toString('base64');
  const body = {
    message: commitMessage,
    content: base64Content,
    branch: DEFAULT_BRANCH,
  };
  // The path should not start with a slash for the contents API
  const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  return fetchFromGitHub<GitHubCommitResponse>(`contents/${normalizedFilePath}`, 'PUT', body);
}


async function fetchFileContent(filePath: string): Promise<string> {
  const fileData = await fetchFromGitHub<GitHubFile>(`contents/${filePath}?ref=${DEFAULT_BRANCH}`);
  if (fileData.type !== 'file' || !fileData.content || fileData.encoding !== 'base64') {
    console.warn(`[GitHub Lib] Could not fetch content for file: ${filePath}. Expected base64 encoded file content. Found:`, fileData);
    throw new Error(`Could not fetch content for file: ${filePath}`);
  }
  return Buffer.from(fileData.content, 'base64').toString('utf-8');
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
      
      let novelContents: GitHubFile[];
      try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`);
      } catch (e) {
        console.error(`[GitHub Lib] Error fetching contents for novel directory '${novelPath}':`, e);
        continue; // Skip this novel if its contents can't be fetched
      }
      
      const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
      if (!infoJsonFile) {
        console.warn(`[GitHub Lib] Skipping novel '${novelId}': info.json not found at path '${novelPath}/info.json'.`);
        continue;
      }

      let infoJsonContent: string;
      let info: InfoJson;
      try {
        infoJsonContent = await fetchFileContent(infoJsonFile.path);
        info = JSON.parse(infoJsonContent) as InfoJson;
      } catch (parseError: any) {
        console.error(`[GitHub Lib] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}`);
        // console.error(`[GitHub Lib] Content of problematic info.json for ${novelId}:\n---\n${infoJsonContent || 'Could not fetch content'}\n---`);
        console.warn(`[GitHub Lib] Skipping novel '${novelId}' due to invalid info.json.`);
        continue; 
      }
      
      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
        console.log(`[GitHub Lib] Novel '${novelId}': Using coverImageUrl from info.json: ${coverImage}`);
      } else {
        coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
        console.warn(`[GitHub Lib] Novel '${novelId}': coverImageUrl not found or empty in info.json. Using placeholder.`);
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
        // For title, let's attempt to extract from HTML content if possible, otherwise default
        // This part is simplified, more robust extraction might be needed.
        return {
          id: file.name.replace('.html', ''), 
          title: `Capítulo ${order}`, // Default title
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
        lastUpdateDate: info.fecha_lanzamiento, // Using release date as last update for now
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
    const novelFolderPath = id; // Assuming novelId is the folder name

    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`);
    } catch (error: any) {
        if (error.message && error.message.includes('404') || error.message && error.message.includes('Not Found')) {
            console.warn(`[GitHub Lib] Novel with id '${id}' not found in GitHub repository (404). Path checked: 'contents/${novelFolderPath}'`);
            return undefined;
        }
        throw error; // Re-throw other errors
    }

    const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
    if (!infoJsonFile) {
      console.warn(`[GitHub Lib] Novel '${id}': info.json not found at path '${novelFolderPath}/info.json'.`);
      return undefined;
    }

    let infoJsonContent: string;
    let info: InfoJson;
    try {
      infoJsonContent = await fetchFileContent(infoJsonFile.path);
      info = JSON.parse(infoJsonContent) as InfoJson;
    } catch (parseError: any) {
      console.error(`[GitHub Lib] Error parsing info.json for novel '${id}' (path: '${infoJsonFile.path}'): ${parseError.message}`);
      // console.error(`[GitHub Lib] Content of problematic info.json for '${id}':\n---\n${infoJsonContent || 'Could not fetch content'}\n---`);
      return undefined;
    }

    let coverImage: string;
    if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
      coverImage = info.coverImageUrl;
      console.log(`[GitHub Lib] Novel Detail '${id}': Using coverImageUrl from info.json: ${coverImage}`);
    } else {
      coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
      console.warn(`[GitHub Lib] Novel Detail '${id}': coverImageUrl not found or empty in info.json. Using placeholder.`);
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
        title: `Capítulo ${order}`, // Default title
        order: order,
      };
    });

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
    };

  } catch (error) {
    console.error(`[GitHub Lib] Error fetching novel by id '${id}':`, error);
    return undefined;
  }
}

export async function fetchChapter(novelId: string, chapterId: string): Promise<{ novel: Novel; chapter: Chapter } | undefined> {
  const novel = await fetchNovelById(novelId); 
  if (!novel) {
    return undefined;
  }

  const chapterMeta = novel.chapters.find(c => c.id === chapterId);
  if (!chapterMeta) {
    console.warn(`[GitHub Lib] Chapter '${chapterId}' not found in metadata for novel '${novelId}'.`);
    return undefined;
  }

  try {
    const chapterFilePath = `${novelId}/${chapterId}.html`; // e.g., novel-name/chapter-1.html
    const chapterContent = await fetchFileContent(chapterFilePath);

    const fullChapter: Chapter = {
      id: chapterMeta.id,
      title: chapterMeta.title, // Use title from metadata
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
