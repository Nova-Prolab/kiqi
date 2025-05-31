
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

export async function fetchFromGitHub<T>(
  path: string,
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  isDelete: boolean = false,
  cacheOptions: RequestCache | { next?: { revalidate?: number | false } } = { next: { revalidate: 60 } } // Default revalidate every 60 seconds
): Promise<T> {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  const missingEnvVars: string[] = [];
  if (!owner) missingEnvVars.push("GITHUB_REPO_OWNER");
  if (!repo) missingEnvVars.push("GITHUB_REPO_NAME");
  
  // PAT is checked for PUT/DELETE or if it's essential for reading private repo contents
  if ((method === 'PUT' || method === 'DELETE' || (path.includes('contents/') && !pat) ) && !pat) {
      missingEnvVars.push("GITHUB_PAT (requerido para esta operación o para leer repositorios privados)");
  }


  if (missingEnvVars.length > 0) {
    const errorMsg = `[GitHub Lib - fetchFromGitHub] Required GitHub environment variable(s) not set: ${missingEnvVars.join(', ')}. Please check your .env file and server configuration. Path: ${path}`;
    console.error(errorMsg);
    if (method === 'GET') {
      // For GET requests, if essential env vars are missing, we might return null or throw,
      // depending on how critical the env vars are for this specific GET.
      // If owner/repo are missing, the URL is invalid. If PAT is missing for a private repo, it will fail.
      // Throwing an error is generally safer to make the issue explicit.
      throw new Error(errorMsg);
    }
    throw new Error(errorMsg);
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (pat) {
    headers['Authorization'] = `token ${pat}`;
  }


  if ((method === 'PUT' || method === 'DELETE') && body) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    ...(typeof cacheOptions === 'string' ? { cache: cacheOptions } : cacheOptions),
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
  return fetchFromGitHub<GitHubCommitResponse>(`contents/${normalizedFilePath}`, 'PUT', body, false, { cache: 'no-store' });
}

export async function deleteFileInRepo(filePath: string, commitMessage: string, sha: string): Promise<GitHubCommitResponse> {
  const body = {
    message: commitMessage,
    sha: sha,
    branch: DEFAULT_BRANCH,
  };
  const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  return fetchFromGitHub<GitHubCommitResponse>(`contents/${normalizedFilePath}`, 'DELETE', body, true, { cache: 'no-store' });
}

export async function getFileSha(filePath: string): Promise<string | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { cache: 'no-store' }); // Use no-store for SHA to get latest
    return fileData?.sha || null;
  } catch (error: any) {
    if (error.message && error.message.includes('404')) {
      return null; // File doesn't exist
    }
    console.error(`[GitHub Lib - getFileSha] Error fetching SHA for '${filePath}':`, error.message);
    return null; // Or rethrow, depending on desired behavior
  }
}

export async function fetchFileContent(filePath: string): Promise<{ content: string; sha: string } | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 60 } });

    if (!fileData || fileData.type !== 'file' || typeof fileData.content === 'undefined' || fileData.encoding !== 'base64') {
      console.warn(`[GitHub Lib - fetchFileContent] File '${filePath}' not found, is not a file, or has no content/wrong encoding.`);
      return null;
    }
    return {
      content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
      sha: fileData.sha,
    };
  } catch (error: any) {
    console.error(`[GitHub Lib - fetchFileContent] Error fetching file content for '${filePath}':`, error.message);
     if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        return null;
    }
    return null;
  }
}


export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  const missingEnvVars: string[] = [];
  if (!owner) missingEnvVars.push("GITHUB_REPO_OWNER");
  if (!repoName) missingEnvVars.push("GITHUB_REPO_NAME");
  // GITHUB_PAT is not strictly required for listing public repo contents,
  // but will be required if the repo is private or for higher rate limits.
  // The check inside fetchFromGitHub will handle PAT for private repos.

  if (missingEnvVars.length > 0) {
    console.error(`[GitHub Lib - fetchNovels] Required GitHub environment variable(s) not set: ${missingEnvVars.join(', ')}. Please check your .env file and server configuration.`);
    return [];
  }

  let rootContents: GitHubFile[];
  try {
    rootContents = await fetchFromGitHub<GitHubFile[]>('contents/', 'GET', undefined, false, { next: { revalidate: 300 } });
    if (!rootContents) {
        console.error('[GitHub Lib - fetchNovels] Failed to fetch root contents from GitHub (received null). Check repository existence and PAT permissions if private.');
        return [];
    }
  } catch (error: any) {
    console.error('[GitHub Lib - fetchNovels] Exception when fetching root contents from GitHub:', error.message);
    return [];
  }

  const novelDirs = rootContents.filter(item => item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'users');
  const novels: Novel[] = [];

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      const infoJsonFile = { path: `${novelPath}/info.json`, name: 'info.json' }; // For logging
      const fileData = await fetchFileContent(infoJsonFile.path);

      if (!fileData) {
        // console.warn(`[GitHub Lib - fetchNovels] Skipping novel '${novelId}': info.json not found or unreadable at path '${infoJsonFile.path}'.`);
        continue;
      }
      const { content: infoJsonContent, sha: infoJsonSha } = fileData;

      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib - fetchNovels] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}`);
        console.error(`[GitHub Lib - fetchNovels] Content of problematic info.json for ${novelId}:\n---\n${infoJsonContent}\n---`);
        // console.warn(`[GitHub Lib - fetchNovels] Skipping novel '${novelId}' due to invalid info.json.`);
        continue;
      }

      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
      } else {
        // console.warn(`[GitHub Lib - fetchNovels] Novel '${novelId}' (path: ${novelPath}): 'coverImageUrl' not found in info.json or is empty. Using placeholder.`);
        coverImage = `https://placehold.co/300x450.png?text=No+Cover`;
      }

      let novelContents: GitHubFile[];
      try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelContents) {
          // console.warn(`[GitHub Lib - fetchNovels] Could not fetch contents of novel directory '${novelPath}' for novel '${novelId}' (received null). Proceeding without chapter listing.`);
          novelContents = [];
        }
      } catch (e: any) {
        // console.warn(`[GitHub Lib - fetchNovels] Exception when fetching contents of novel directory '${novelPath}' for novel '${novelId}'. Error: ${e.message}. Proceeding without chapter listing.`);
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
        // Attempt to extract title from H1 if present, otherwise default
        // This part is removed as per previous instructions to not parse HTML for titles here
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
      // console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': info.json not found or unreadable at path '${infoJsonFilePath}'.`);
      return undefined;
    }
    const { content: infoJsonContent, sha: infoJsonSha } = fileData;

    let info: InfoJson;
    try {
      info = JSON.parse(infoJsonContent);
    } catch (parseError: any) {
      console.error(`[GitHub Lib - fetchNovelById] Error parsing info.json for novel '${id}' (path: '${infoJsonFilePath}'): ${parseError.message}`);
      console.error(`[GitHub Lib - fetchNovelById] Content of problematic info.json for ${id}:\n---\n${infoJsonContent}\n---`);
      return undefined;
    }

    let coverImage: string;
    if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
      coverImage = info.coverImageUrl;
    } else {
      // console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': 'coverImageUrl' not found in info.json or is empty. Using placeholder.`);
      coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
    }

    let novelContents: GitHubFile[];
    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelContents) {
            // console.warn(`[GitHub Lib - fetchNovelById] Contents for novel with id '${id}' not found in GitHub repository (received null). Path checked: 'contents/${novelFolderPath}'. This novel might not have chapters yet or the folder is missing.`);
            novelContents = [];
        }
    } catch (error: any) {
        if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
            // console.warn(`[GitHub Lib - fetchNovelById] Contents for novel with id '${id}' not found in GitHub repository (404). Path checked: 'contents/${novelFolderPath}'. This novel might not have chapters yet or the folder is missing.`);
            novelContents = [];
        } else {
          // console.warn(`[GitHub Lib - fetchNovelById] Could not fetch contents of novel directory '${novelFolderPath}' to list chapters for novel '${id}'. Error: ${error.message}. Proceeding without chapters.`);
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

  } catch (error: any) {
    console.error(`[GitHub Lib - fetchNovelById] Unexpected error processing novel '${id}':`, error.message || error);
    return undefined;
  }
}

export async function fetchChapter(novelId: string, chapterId: string): Promise<{ novel: Novel; chapter: Chapter } | null> {
  const novel = await fetchNovelById(novelId);
  if (!novel) {
    console.warn(`[GitHub Lib - fetchChapter] Novel with id '${novelId}' not found when trying to fetch chapter '${chapterId}'.`);
    return null;
  }

  const chapterMetadata = novel.chapters.find(ch => ch.id === chapterId);
  if (!chapterMetadata) {
    console.warn(`[GitHub Lib - fetchChapter] Chapter metadata for '${chapterId}' not found in novel '${novelId}'.`);
    return null;
  }

  const chapterFilePath = `${novelId}/${chapterId}.html`;
  const fileData = await fetchFileContent(chapterFilePath);

  if (!fileData || !fileData.content) {
    console.warn(`[GitHub Lib - fetchChapter] Content for chapter '${chapterId}' (path: '${chapterFilePath}') not found or is empty for novel '${novelId}'.`);
    return null;
  }

  // Basic HTML title extraction (optional, could be improved with a proper parser if needed)
  let chapterTitle = chapterMetadata.title;
  const titleMatch = fileData.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (titleMatch && titleMatch[1]) {
      chapterTitle = titleMatch[1].trim();
  }


  const chapter: Chapter = {
    id: chapterId,
    title: chapterTitle, // Use extracted title if available, else default
    order: chapterMetadata.order,
    content: fileData.content,
    path: `/novels/${novelId}/chapters/${chapterId}`,
  };

  return { novel, chapter };
}
