
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
  
  if ((method === 'PUT' || method === 'DELETE') && !pat) {
      missingEnvVars.push("GITHUB_PAT (requerido para operaciones de escritura/eliminación)");
  }
  // Para GET a 'contents/', si el repo es privado, el PAT es esencial.
  // La API fallará con 404 si el repo es privado y no hay PAT o es inválido.


  if (missingEnvVars.length > 0) {
    const errorMsg = `[GitHub Lib - fetchFromGitHub] Required GitHub environment variable(s) not set: ${missingEnvVars.join(', ')}. Please check your .env file or Netlify environment variables. Path: ${path}`;
    console.error(errorMsg);
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
    
    let detailedErrorMessage = `[GitHub Lib - fetchFromGitHub] GitHub API error for ${method} ${url}: ${response.status} - ${errorData.message || response.statusText}`;
    if (response.status === 404 && path.startsWith('contents/')) {
        detailedErrorMessage += `\n  Possible causes for 404 on 'contents/':
    1. Repository '${owner}/${repo}' or path '${path}' does not exist.
    2. If the repository is private, the GITHUB_PAT may be missing, invalid, or lack 'repo' scope permissions.
    Please verify GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_PAT (if repo is private), and that the repository structure is correct.`;
    } else if (response.status === 401 || response.status === 403) {
        detailedErrorMessage += `\n  This suggests an authentication or authorization issue with GitHub.
    1. Ensure GITHUB_PAT is correct and has necessary permissions (e.g., 'repo' scope for private repos).
    2. The PAT might have expired or been revoked.`;
    }
    console.error(detailedErrorMessage, 'Full error response:', errorData);

    if (method === 'GET' && response.status === 404) {
      return null as T;
    }
    throw new Error(`Failed to ${method === 'GET' ? 'fetch from' : method === 'PUT' ? 'write to' : 'delete from'} GitHub: ${errorData.message || response.statusText}. Status: ${response.status}`);
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
    return null;
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

  // Las comprobaciones de variables de entorno GITHUB_REPO_OWNER y GITHUB_REPO_NAME
  // ya ocurren en fetchFromGitHub y lanzarán un error si faltan.

  let rootContents: GitHubFile[];
  try {
    rootContents = await fetchFromGitHub<GitHubFile[]>('contents/', 'GET', undefined, false, { next: { revalidate: 300 } });
    if (!rootContents) {
        console.error(`[GitHub Lib - fetchNovels] Failed to fetch root contents from GitHub for repository '${owner}/${repoName}' (API returned null). 
This often means the 'contents/' path was not found (404 error).
Possible reasons:
  1. Incorrect GITHUB_REPO_OWNER ('${owner}') or GITHUB_REPO_NAME ('${repoName}').
  2. The repository is private and GITHUB_PAT is missing, invalid, or lacks permissions.
  3. The repository is empty or does not have a 'contents/' directory at its root (though 'contents/' refers to the root content listing).
Please verify your Netlify environment variables and repository settings.`);
        return [];
    }
    if (rootContents.length === 0) {
        console.warn(`[GitHub Lib - fetchNovels] Fetched root contents for '${owner}/${repoName}', but it's an empty array. This means the root of your repository appears to have no directories or files that represent novels. Ensure your novel folders are at the root of the repository.`);
        // No es necesariamente un error si el repositorio está intencionalmente vacío de novelas.
    }
  } catch (error: any) {
    // El error ya debería haber sido logueado con detalles por fetchFromGitHub.
    // Solo añadimos un contexto específico de fetchNovels.
    console.error(`[GitHub Lib - fetchNovels] An exception occurred while trying to fetch root contents for repository '${owner}/${repoName}'. The operation cannot proceed. Details should be in preceding logs from fetchFromGitHub.`);
    return [];
  }

  const novelDirs = rootContents.filter(item => item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'users');
  if (novelDirs.length === 0 && rootContents.length > 0) {
    console.warn(`[GitHub Lib - fetchNovels] No directories that look like novel folders were found at the root of '${owner}/${repoName}'. Novel folders should not start with '.' or be named 'users'. Current non-hidden directories: ${rootContents.filter(i => i.type ==='dir' && !i.name.startsWith('.')).map(d => d.name).join(', ') || 'None'}`);
  }
  
  const novels: Novel[] = [];

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      const infoJsonFile = { path: `${novelPath}/info.json`, name: 'info.json' };
      const fileData = await fetchFileContent(infoJsonFile.path);

      if (!fileData) {
        continue;
      }
      const { content: infoJsonContent, sha: infoJsonSha } = fileData;

      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib - fetchNovels] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}. Skipping this novel.`);
        continue;
      }

      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
      } else {
        coverImage = `https://placehold.co/300x450.png?text=No+Cover`;
      }

      let novelContents: GitHubFile[];
      try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelContents) {
          novelContents = [];
        }
      } catch (e: any) {
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
        status: info.status,
        rating_platform: info.rating_platform,
      });
    } catch (error) {
      console.error(`[GitHub Lib - fetchNovels] Error processing novel directory '${dir.name}':`, error);
    }
  }
  if (novels.length === 0 && novelDirs.length > 0) {
    console.warn(`[GitHub Lib - fetchNovels] Processed ${novelDirs.length} potential novel director(ies), but ended up with 0 valid novels. Check for parsing errors or missing info.json files in the logs above.`);
  }
  return novels;
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  // Las comprobaciones de GITHUB_REPO_OWNER y GITHUB_REPO_NAME ya ocurren en fetchFromGitHub
  // y lanzarán un error si faltan, que será capturado abajo.

  try {
    const novelFolderPath = id;
    const infoJsonFilePath = `${novelFolderPath}/info.json`;

    const fileData = await fetchFileContent(infoJsonFilePath);
    if (!fileData) {
      console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': info.json not found or unreadable. This could be due to incorrect novel ID, or the info.json file is missing in the folder '${novelFolderPath}' of the repository '${owner}/${repoName}'.`);
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
      coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
    }

    let novelContents: GitHubFile[];
    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelContents) {
            novelContents = [];
        }
    } catch (error: any) {
        if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
            novelContents = [];
        } else {
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
      status: info.status,
      rating_platform: info.rating_platform,
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
    console.warn(`[GitHub Lib - fetchChapter] Chapter metadata for '${chapterId}' not found in novel '${novelId}'. The chapter might not exist or there's a mismatch in IDs.`);
    return null;
  }

  const chapterFilePath = `${novelId}/${chapterId}.html`;
  const fileData = await fetchFileContent(chapterFilePath);

  if (!fileData || !fileData.content) {
    console.warn(`[GitHub Lib - fetchChapter] Content for chapter '${chapterId}' (path: '${chapterFilePath}') not found or is empty for novel '${novelId}'.`);
    return null;
  }

  let chapterTitle = chapterMetadata.title;
  const titleMatch = fileData.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (titleMatch && titleMatch[1]) {
      chapterTitle = titleMatch[1].trim();
  }


  const chapter: Chapter = {
    id: chapterId,
    title: chapterTitle, 
    order: chapterMetadata.order,
    content: fileData.content,
    path: `/novels/${novelId}/chapters/${chapterId}`,
  };

  return { novel, chapter };
}
    