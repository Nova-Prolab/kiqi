
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

// Export this function so it can be used by userActions
export async function fetchFromGitHub<T>(
  path: string,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  isDelete: boolean = false
): Promise<T> {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    const missingVars = [];
    if (!pat) missingVars.push("GITHUB_PAT");
    if (!owner) missingVars.push("GITHUB_REPO_OWNER");
    if (!repo) missingVars.push("GITHUB_REPO_NAME");
    const errorMsg = `[GitHub Lib - fetchFromGitHub] Required GitHub environment variable(s) not set: ${missingVars.join(', ')}. Please check your .env file and restart the server.`;
    console.error(errorMsg);
    // Instead of throwing, which might crash the server/build, return null or an empty array for GET requests
    // to allow the UI to handle the "no data" state more gracefully.
    // For PUT/DELETE, throwing might still be appropriate.
    if (method === 'GET') {
      return null as T; // Or appropriate empty value like [] for arrays
    }
    throw new Error(errorMsg);
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  const headers: HeadersInit = {
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if ((method === 'PUT' || method === 'DELETE') && body) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store', // To ensure fresh data during development/debugging
    // next: { revalidate: 0 } // Alternative to cache: 'no-store' for Next.js fetch
  };

  if ((method === 'PUT' || method === 'DELETE') && body) {
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
    if (method === 'GET' && response.status === 404) {
      return null as T; 
    }
    throw new Error(`Failed to ${method === 'GET' ? 'fetch from' : method === 'PUT' ? 'write to' : 'delete from'} GitHub: ${errorData.message || response.statusText}`);
  }

  if (isDelete && response.status === 200) { 
     return { commit: { sha: 'deleted' } } as T; 
  }
  if (response.status === 204 || response.status === 205 ) { 
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function createFileInRepo(filePath: string, content: string, commitMessage: string, sha?: string): Promise<GitHubCommitResponse> {
  const base64Content = Buffer.from(content).toString('base64');
  const body: { message: string; content: string; branch: string; sha?: string } = {
    message: commitMessage,
    content: base64Content,
    branch: DEFAULT_BRANCH,
  };
  if (sha) {
    body.sha = sha; 
  }
  const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  return fetchFromGitHub<GitHubCommitResponse>(`contents/${normalizedFilePath}`, 'PUT', body);
}

export async function deleteFileInRepo(filePath: string, commitMessage: string, sha: string): Promise<GitHubCommitResponse> {
  const body = {
    message: commitMessage,
    sha: sha,
    branch: DEFAULT_BRANCH,
  };
  const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  return fetchFromGitHub<GitHubCommitResponse>(`contents/${normalizedFilePath}`, 'DELETE', body, true);
}

export async function fetchFileContent(filePath: string): Promise<{ content: string; sha: string } | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`);

    if (!fileData || fileData.type !== 'file' || !fileData.content || fileData.encoding !== 'base64') {
      // console.warn(`[GitHub Lib - fetchFileContent] File '${filePath}' not found, is not a file, or has no content/wrong encoding.`);
      return null;
    }
    return {
      content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
      sha: fileData.sha,
    };
  } catch (error: any) {
    console.error(`[GitHub Lib - fetchFileContent] Error fetching file content for '${filePath}':`, error);
    // Do not re-throw here if fetchFromGitHub already throws or returns null for 404
    // Let the caller handle null or thrown error from fetchFromGitHub.
    if (error.message.includes('Failed to fetch from GitHub')) { // Or a more specific check
        return null; // If fetchFromGitHub converted 404 to null
    }
    throw error; // Re-throw other errors
  }
}


export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  const missingEnvVars: string[] = [];
  if (!owner) missingEnvVars.push("GITHUB_REPO_OWNER");
  if (!repoName) missingEnvVars.push("GITHUB_REPO_NAME");

  if (missingEnvVars.length > 0) {
    console.error(`[GitHub Lib - fetchNovels] Required GitHub environment variable(s) not set: ${missingEnvVars.join(', ')}. Please check your .env file and restart the server.`);
    return [];
  }
  // GITHUB_PAT will be checked by fetchFromGitHub called below.

  let rootContents: GitHubFile[];
  try {
    rootContents = await fetchFromGitHub<GitHubFile[]>('contents/');
    if (!rootContents) { // Handle case where fetchFromGitHub returns null (e.g., repo not found or PAT issue)
        console.error('[GitHub Lib - fetchNovels] Failed to fetch root contents from GitHub (received null). Check repository existence and PAT permissions.');
        return [];
    }
  } catch (error) {
    console.error('[GitHub Lib - fetchNovels] Exception when fetching root contents from GitHub:', error);
    return [];
  }

  const novelDirs = rootContents.filter(item => item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'users');
  const novels: Novel[] = [];

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      const infoJsonFile = { path: `${novelPath}/info.json`, name: 'info.json' };
      const fileData = await fetchFileContent(infoJsonFile.path);

      if (!fileData) {
        console.warn(`[GitHub Lib - fetchNovels] Skipping novel '${novelId}': info.json not found or unreadable at path '${infoJsonFile.path}'.`);
        continue;
      }
      const { content: infoJsonContent, sha: infoJsonSha } = fileData;

      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib - fetchNovels] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}`);
        console.error(`[GitHub Lib - fetchNovels] Content of problematic info.json for ${novelId}:\n---\n${infoJsonContent}\n---`);
        console.warn(`[GitHub Lib - fetchNovels] Skipping novel '${novelId}' due to invalid info.json.`);
        continue;
      }

      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
      } else {
        console.warn(`[GitHub Lib - fetchNovels] Novel '${novelId}' (path: ${novelPath}): 'coverImageUrl' not found in info.json or is empty. Using placeholder.`);
        coverImage = `https://placehold.co/300x450.png?text=No+Cover`;
      }

      let novelContents: GitHubFile[];
      try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`);
         if (!novelContents) {
          console.warn(`[GitHub Lib - fetchNovels] Could not fetch contents of novel directory '${novelPath}' for novel '${novelId}' (received null). Proceeding without chapter listing.`);
          novelContents = [];
        }
      } catch (e: any) {
        console.warn(`[GitHub Lib - fetchNovels] Exception when fetching contents of novel directory '${novelPath}' for novel '${novelId}'. Error: ${e.message}. Proceeding without chapter listing.`);
        novelContents = [];
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
          title: `Capítulo ${order}`, 
          order: order,
        };
      });

      novels.push({
        id: novelId,
        title: info.titulo,
        author: info.autor,
        summary: info.descripcion ? info.descripcion.replace(/\\n/g, '\n') : "Sin descripción.",
        coverImage: coverImage,
        chapters: chaptersMetadata,
        ageRating: info.ageRating,
        fecha_lanzamiento: info.fecha_lanzamiento,
        etiquetas: info.etiquetas,
        categoria: info.categoria,
        traductor: info.traductor,
        lastUpdateDate: info.fecha_lanzamiento,
        infoJsonSha: infoJsonSha,
        creatorId: info.creatorId,
      });
    } catch (error) {
      console.error(`[GitHub Lib - fetchNovels] Error processing novel directory '${dir.name}':`, error);
    }
  }
  return novels;
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  const missingEnvVars: string[] = [];
  if (!owner) missingEnvVars.push("GITHUB_REPO_OWNER");
  if (!repoName) missingEnvVars.push("GITHUB_REPO_NAME");

  if (missingEnvVars.length > 0) {
    console.error(`[GitHub Lib - fetchNovelById] Required GitHub environment variable(s) not set for novel '${id}': ${missingEnvVars.join(', ')}. Please check your .env file and restart the server.`);
    return undefined;
  }
  // GITHUB_PAT will be checked by fetchFileContent -> fetchFromGitHub called below.

  try {
    const novelFolderPath = id;
    const infoJsonFilePath = `${novelFolderPath}/info.json`;

    const fileData = await fetchFileContent(infoJsonFilePath);
    if (!fileData) {
      console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': info.json not found or unreadable at path '${infoJsonFilePath}'.`);
      return undefined;
    }
    const { content: infoJsonContent, sha: infoJsonSha } = fileData;

    let info: InfoJson;
    try {
      info = JSON.parse(infoJsonContent);
    } catch (parseError: any) {
      console.error(`[GitHub Lib - fetchNovelById] Error parsing info.json for novel '${id}' (path: '${infoJsonFilePath}'): ${parseError.message}`);
      return undefined;
    }

    let coverImage: string;
    if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
      coverImage = info.coverImageUrl;
    } else {
      console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': 'coverImageUrl' not found in info.json or is empty. Using placeholder.`);
      coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
    }

    let novelContents: GitHubFile[];
    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`);
         if (!novelContents) {
            console.warn(`[GitHub Lib - fetchNovelById] Contents for novel with id '${id}' not found in GitHub repository (received null). Path checked: 'contents/${novelFolderPath}'. This novel might not have chapters yet or the folder is missing.`);
            novelContents = [];
        }
    } catch (error: any) {
        if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
            console.warn(`[GitHub Lib - fetchNovelById] Contents for novel with id '${id}' not found in GitHub repository (404). Path checked: 'contents/${novelFolderPath}'. This novel might not have chapters yet or the folder is missing.`);
            novelContents = [];
        } else {
          console.warn(`[GitHub Lib - fetchNovelById] Could not fetch contents of novel directory '${novelFolderPath}' to list chapters for novel '${id}'. Error: ${error.message}. Proceeding without chapters.`);
          novelContents = [];
        }
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
        title: `Capítulo ${order}`,
        order: order,
      };
    });

    return {
      id: id,
      title: info.titulo,
      author: info.autor,
      summary: info.descripcion ? info.descripcion.replace(/\\n/g, '\n') : "Sin descripción.",
      coverImage: coverImage,
      chapters: chaptersMetadata,
      ageRating: info.ageRating,
      fecha_lanzamiento: info.fecha_lanzamiento,
      etiquetas: info.etiquetas,
      categoria: info.categoria,
      traductor: info.traductor,
      lastUpdateDate: info.fecha_lanzamiento,
      infoJsonSha: infoJsonSha,
      creatorId: info.creatorId,
    };

  } catch (error) {
    console.error(`[GitHub Lib - fetchNovelById] Error fetching novel by id '${id}':`, error);
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
    console.warn(`[GitHub Lib - fetchChapter] Chapter '${chapterId}' not found in metadata for novel '${novelId}'.`);
    return undefined;
  }

  try {
    const chapterFilePath = `${novelId}/${chapterId}.html`;
    const fileData = await fetchFileContent(chapterFilePath);
    if (!fileData || !fileData.content) {
        console.warn(`[GitHub Lib - fetchChapter] Chapter content for '${chapterFilePath}' not found or unreadable.`);
        return undefined;
    }
    const chapterContent = fileData.content;

    let finalChapterTitle = chapterMeta.title; // Default to "Capítulo X"
    // Try to extract title from <h1> tag if present
    const h1Match = chapterContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
        const extractedTitle = h1Match[1].trim();
        if (extractedTitle) { // Ensure extracted title is not empty
            finalChapterTitle = extractedTitle;
        }
    }


    const fullChapter: Chapter = {
      id: chapterMeta.id,
      title: finalChapterTitle,
      order: chapterMeta.order,
      content: chapterContent,
      path: chapterFilePath,
    };
    return { novel, chapter: fullChapter };
  } catch (error) {
    console.error(`[GitHub Lib - fetchChapter] Error fetching chapter content for '${novelId}/${chapterId}':`, error);
    return undefined;
  }
}

export async function getFileSha(filePath: string): Promise<string | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`);
    return fileData ? fileData.sha : null;
  } catch (error) {
    // console.warn(`[GitHub Lib - getFileSha] Failed to get SHA for '${filePath}':`, error);
    return null; // Return null on any error, including 404
  }
}
