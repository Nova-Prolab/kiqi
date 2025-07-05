
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
  cacheOptions: RequestCache | { next?: { revalidate?: number | false } } = { next: { revalidate: 60 } }
): Promise<T | null> { // Modified to allow T | null
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  const pat = process.env.GITHUB_PAT;

  const patSnippet = pat ? `${pat.substring(0, 4)}...${pat.substring(pat.length - 4)}` : 'Not Set';
  const patLength = pat ? pat.length : 0;

  console.log(`[GitHub Lib - fetchFromGitHub] Initializing. Owner: '${owner || '[OWNER_NOT_SET]'}', Repo: '${repo || '[REPO_NOT_SET]'}', PAT Present: ${!!pat}, PAT Length: ${patLength}, PAT Snippet: ${patSnippet}. Attempting path: '${path}'`);

  const missingEnvVars: string[] = [];
  if (!owner) missingEnvVars.push("GITHUB_REPO_OWNER");
  if (!repo) missingEnvVars.push("GITHUB_REPO_NAME");
  
  if (missingEnvVars.length > 0) {
    const errorMsg = `[GitHub Lib - fetchFromGitHub] CRITICAL CONFIGURATION ISSUE: The following essential GitHub environment variable(s) are NOT SET in your Netlify environment: ${missingEnvVars.join(', ')}. The application cannot connect to GitHub without them. Please go to your Netlify site settings, find "Environment variables", and ensure GITHUB_REPO_OWNER and GITHUB_REPO_NAME are correctly defined and have the proper values. Path that was attempted: ${path}`;
    console.error(errorMsg);
    // Return null to prevent a crash, allowing the app to show "no novels" gracefully.
    return null;
  }
  
  if ((method === 'PUT' || method === 'DELETE') && !pat) {
      const errorMsg = `[GitHub Lib - fetchFromGitHub] CRITICAL CONFIGURATION ISSUE: The GITHUB_PAT environment variable is required for write/delete operations but is NOT SET in your Netlify environment. Operation was ${method} on path '${path}'.`;
      console.error(errorMsg);
      // For write operations, we must throw an error as they cannot proceed.
      throw new Error(errorMsg);
  }
  
  // Adjusted warning for public repositories
  if (method === 'GET' && !pat) {
    console.warn(`[GitHub Lib - fetchFromGitHub] WARNING: GITHUB_PAT is not set. For public repositories, this is okay, but you may encounter API rate limits from GitHub on a high-traffic site. Providing a PAT is recommended to avoid this.`);
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
  
  console.log(`[GitHub Lib - fetchFromGitHub] Attempting ${method} request to URL: ${url}`);
  const response = await fetch(url, options);
  console.log(`[GitHub Lib - fetchFromGitHub] Response status for ${method} ${url}: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    let errorData: { message?: string } = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    
    let detailedErrorMessage = `[GitHub Lib - fetchFromGitHub] GitHub API error for ${method} ${url}: ${response.status} - ${errorData.message || response.statusText}`;
    if (response.status === 404 && path.startsWith('contents/')) {
        detailedErrorMessage += `\n  For 404 on 'contents/':
    1. Verify GITHUB_REPO_OWNER ('${owner}') and GITHUB_REPO_NAME ('${repo}'). Case-sensitive!
    2. Since the repo is public, a 404 likely means the repository name is wrong or the base path '${path}' does not exist.
    The constructed URL was: ${url}`;
    } else if (response.status === 401 || response.status === 403) {
        detailedErrorMessage += `\n  Authentication/Authorization error (${response.status}):
    1. If you provided a GITHUB_PAT, it may be incorrect, expired, or revoked. Check your Netlify environment variable GITHUB_PAT.
    The PAT snippet being used by the app is: ${patSnippet} (Length: ${patLength}). Compare this with the PAT you have set in Netlify.
    The constructed URL was: ${url}`;
    } else {
        detailedErrorMessage += `\n  The constructed URL was: ${url}`;
    }
    console.error(detailedErrorMessage, 'Full error response object:', errorData);

    if (method === 'GET' && response.status === 404) {
      return null; 
    }
    // For other errors, throw. This includes 401, 403, 500s, etc.
    // The missing owner/repo case is now handled above by returning null.
    throw new Error(`Failed to ${method === 'GET' ? 'fetch from' : method === 'PUT' ? 'write to' : 'delete from'} GitHub: ${errorData.message || response.statusText}. Status: ${response.status}. URL: ${url}`);
  }

  if (isDelete && response.status === 200) { 
     return { commit: { sha: 'deleted' } } as unknown as T; 
  }
  if (response.status === 204 ) { 
    return null;
  }

  return response.json() as Promise<T>;
}

export async function createFileInRepo(filePath: string, content: string, commitMessage: string, sha?: string): Promise<GitHubCommitResponse | null> {
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

export async function deleteFileInRepo(filePath: string, commitMessage: string, sha: string): Promise<GitHubCommitResponse | null> {
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
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { cache: 'no-store' }); 
    return fileData?.sha || null;
  } catch (error: any) {
    if (error.message && error.message.includes('404')) { 
      return null; 
    }
    console.error(`[GitHub Lib - getFileSha] Error explicitly caught while fetching SHA for '${filePath}':`, error.message);
    return null;
  }
}

export async function fetchFileContent(filePath: string): Promise<{ content: string; sha: string } | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 60 } });

    if (!fileData || fileData.type !== 'file' || typeof fileData.content === 'undefined' || fileData.encoding !== 'base64') {
      console.warn(`[GitHub Lib - fetchFileContent] File '${filePath}' not found, is not a file, or has no content/wrong encoding. FileData received:`, fileData);
      return null;
    }
    return {
      content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
      sha: fileData.sha,
    };
  } catch (error: any) {
     if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        console.warn(`[GitHub Lib - fetchFileContent] Explicitly caught 404 for '${filePath}'.`);
        return null;
    }
    console.error(`[GitHub Lib - fetchFileContent] Unexpected error explicitly caught for '${filePath}':`, error.message);
    return null;
  }
}


export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  console.log(`[GitHub Lib - fetchNovels] Starting to fetch novels. Using Owner: '${owner || '[OWNER_NOT_SET]'}', Repo: '${repoName || '[REPO_NOT_SET]'}'`);

  let rootContents: GitHubFile[] | null; 
  try {
    rootContents = await fetchFromGitHub<GitHubFile[]>('contents/', 'GET', undefined, false, { cache: 'no-store' }); 
    
    if (rootContents === null) { 
        console.error(`[GitHub Lib - fetchNovels] CRITICAL: Failed to fetch root contents from GitHub for repository '${owner || '[OWNER_NOT_SET]'}/${repoName || '[REPO_NOT_SET]'}' (API returned null). 
This is often due to missing GITHUB_REPO_OWNER/GITHUB_REPO_NAME environment variables in Netlify, or a 404 error (repository not found or PAT has insufficient permissions for a private repo).
Please verify your Netlify environment variables and repository settings. NO NOVELS WILL BE LOADED.`);
        return []; 
    }
    if (rootContents.length === 0) {
        console.warn(`[GitHub Lib - fetchNovels] Fetched root contents for '${owner}/${repoName}', but it's an empty array. This means the root of your repository has no files or directories. If you have novels, ensure their folders are at the root of the repository.`);
    }
  } catch (error: any) {
    console.error(`[GitHub Lib - fetchNovels] An error occurred while trying to fetch root contents for repository '${owner || '[OWNER_NOT_SET]'}/${repoName || '[REPO_NOT_SET]'}'. Details: ${error.message}`, error);
    return [];
  }

  const novelDirs = rootContents.filter(item => item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'users');
  if (novelDirs.length === 0 && rootContents.length > 0) {
    const allDirs = rootContents.filter(i => i.type === 'dir').map(d => d.name).join(', ') || 'None';
    console.warn(`[GitHub Lib - fetchNovels] No directories that appear to be novel folders were found at the root of '${owner}/${repoName}'. 
Novel folders should not start with '.' (e.g., '.git', '.vscode') and should not be named 'users'. 
Found directories: ${allDirs}. If these are your novel folders, check their naming. If no novel-like folders are listed, ensure they are in the root of the repository.`);
  }
  
  const novels: Novel[] = [];
  console.log(`[GitHub Lib - fetchNovels] Found ${novelDirs.length} potential novel director(ies): ${novelDirs.map(d => d.name).join(', ')}`);

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      console.log(`[GitHub Lib - fetchNovels] Processing directory: '${novelId}'`);
      const infoJsonFile = { path: `${novelPath}/info.json`, name: 'info.json' };
      const fileData = await fetchFileContent(infoJsonFile.path);

      if (!fileData) {
        console.warn(`[GitHub Lib - fetchNovels] Novel '${novelId}': info.json not found or unreadable at path '${infoJsonFile.path}'. Skipping this novel.`);
        continue;
      }
      const { content: infoJsonContent, sha: infoJsonSha } = fileData;

      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib - fetchNovels] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}. Content was: "${infoJsonContent.substring(0,100)}...". Skipping this novel.`);
        continue;
      }

      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
      } else {
        coverImage = `https://placehold.co/300x450.png?text=No+Cover`;
      }

      let novelDirContents: GitHubFile[] | null;
      try {
        novelDirContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelDirContents) { 
          console.warn(`[GitHub Lib - fetchNovels] Could not fetch contents for novel directory '${novelPath}'. Skipping chapter processing for this novel.`);
          novelDirContents = []; 
        }
      } catch (e: any) {
        console.error(`[GitHub Lib - fetchNovels] Error fetching contents for novel directory '${novelPath}': ${e.message}. Skipping chapter processing for this novel.`);
        novelDirContents = [];
      }

      const chapterFiles = novelDirContents
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
      
      console.log(`[GitHub Lib - fetchNovels] Successfully processed info.json for novel '${novelId}'. Found ${chaptersMetadata.length} chapter files.`);
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
    } catch (error: any) {
      console.error(`[GitHub Lib - fetchNovels] Unhandled error processing potential novel directory '${dir.name}': ${error.message}`, error);
    }
  }

  if (novels.length === 0 && novelDirs.length > 0) {
    console.warn(`[GitHub Lib - fetchNovels] Processed ${novelDirs.length} potential novel director(ies), but resulted in 0 valid novels being added to the list. Check logs above for parsing errors or missing info.json files.`);
  }
  console.log(`[GitHub Lib - fetchNovels] Finished. Returning ${novels.length} novel(s).`);
  return novels;
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;
  console.log(`[GitHub Lib - fetchNovelById] Fetching novel by ID: '${id}'. Using Owner: '${owner || '[OWNER_NOT_SET]'}', Repo: '${repoName || '[REPO_NOT_SET]'}'`);

  if (!owner || !repoName) {
    console.error(`[GitHub Lib - fetchNovelById] CRITICAL: GITHUB_REPO_OWNER or GITHUB_REPO_NAME is not set in the environment. Cannot fetch novel by ID.`);
    return undefined;
  }

  try {
    const novelFolderPath = id; 
    const infoJsonFilePath = `${novelFolderPath}/info.json`;

    const fileData = await fetchFileContent(infoJsonFilePath);
    if (!fileData) {
      console.warn(`[GitHub Lib - fetchNovelById] Novel '${id}': info.json not found or unreadable at path '${infoJsonFilePath}'. This could be due to an incorrect novel ID, or the info.json file is missing in the folder '${novelFolderPath}' of the repository '${owner}/${repoName}'.`);
      return undefined;
    }
    const { content: infoJsonContent, sha: infoJsonSha } = fileData;

    let info: InfoJson;
    try {
      info = JSON.parse(infoJsonContent);
    } catch (parseError: any) {
      console.error(`[GitHub Lib - fetchNovelById] Error parsing info.json for novel '${id}' (path: '${infoJsonFilePath}'): ${parseError.message}. Content was: "${infoJsonContent.substring(0,100)}..."`);
      return undefined;
    }

    let coverImage: string;
    if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
      coverImage = info.coverImageUrl;
    } else {
      coverImage = 'https://placehold.co/300x450.png?text=No+Cover';
    }

    let novelDirContents: GitHubFile[] | null;
    try {
        novelDirContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`, 'GET', undefined, false, { next: { revalidate: 120 } });
         if (!novelDirContents) {
            console.warn(`[GitHub Lib - fetchNovelById] Could not fetch contents for novel directory '${novelFolderPath}' for novel '${id}'. Assuming no chapters.`);
            novelDirContents = [];
        }
    } catch (error: any) {
        console.error(`[GitHub Lib - fetchNovelById] Error fetching contents for novel directory '${novelFolderPath}' for novel '${id}': ${error.message}. Assuming no chapters.`);
        novelDirContents = [];
    }

    const chapterFiles = novelDirContents
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
    
    console.log(`[GitHub Lib - fetchNovelById] Successfully processed novel '${id}'. Found ${chaptersMetadata.length} chapter files.`);
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
  console.log(`[GitHub Lib - fetchChapter] Fetching chapter '${chapterId}' for novel '${novelId}'`);
  const novel = await fetchNovelById(novelId);
  if (!novel) {
    console.warn(`[GitHub Lib - fetchChapter] Novel with id '${novelId}' not found when trying to fetch chapter '${chapterId}'.`);
    return null;
  }

  const chapterMetadata = novel.chapters.find(ch => ch.id === chapterId);
  if (!chapterMetadata) {
    console.warn(`[GitHub Lib - fetchChapter] Chapter metadata for '${chapterId}' not found in novel '${novelId}'. Available chapter IDs: ${novel.chapters.map(c => c.id).join(', ')}. The chapter might not exist or there's a mismatch in IDs.`);
    return null;
  }

  const chapterFilePath = `${novelId}/${chapterId}.html`;
  const fileData = await fetchFileContent(chapterFilePath);

  if (!fileData || !fileData.content) {
    console.warn(`[GitHub Lib - fetchChapter] Content for chapter '${chapterId}' (path: '${chapterFilePath}') not found or is empty for novel '${novelId}'.`);
    return null;
  }

  let chapterTitle = chapterMetadata.title; 
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  let h1Text: string | null = null;

  if (tempDiv) {
      tempDiv.innerHTML = fileData.content;
      const h1Element = tempDiv.querySelector('h1');
      if (h1Element && h1Element.textContent) {
          h1Text = h1Element.textContent.trim();
      }
  } else {
      
      const titleMatch = fileData.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
          h1Text = titleMatch[1].replace(/<[^>]+>/g, '').trim(); 
      }
  }
  
  if (h1Text && h1Text.length > 0) {
    chapterTitle = h1Text;
    console.log(`[GitHub Lib - fetchChapter] Extracted H1 title for '${chapterId}': '${chapterTitle}'`);
  } else {
    console.log(`[GitHub Lib - fetchChapter] No H1 title found for '${chapterId}', using metadata title: '${chapterTitle}'`);
  }


  const chapter: Chapter = {
    id: chapterId,
    title: chapterTitle, 
    order: chapterMetadata.order,
    content: fileData.content,
    path: `/novels/${novelId}/chapters/${chapterId}`,
  };
  
  console.log(`[GitHub Lib - fetchChapter] Successfully fetched chapter '${chapterId}' for novel '${novelId}'.`);
  return { novel, chapter };
}
    

    
