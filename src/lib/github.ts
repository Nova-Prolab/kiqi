
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
  method: 'GET' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  isDelete: boolean = false
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

  if ((method === 'PUT' || method === 'DELETE') && body) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    cache: 'no-store', // No caching for now during dev/debug
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
    // Add specific check for 404 on GET to avoid throwing for non-existent files that are being checked
    if (method === 'GET' && response.status === 404) {
      return null as T; // Explicitly return null for 404 on GET
    }
    throw new Error(`Failed to ${method === 'GET' ? 'fetch from' : method === 'PUT' ? 'write to' : 'delete from'} GitHub: ${errorData.message || response.statusText}`);
  }

  if (isDelete && response.status === 200) { // For delete, a 200 with empty body is success
     return { commit: { sha: 'deleted' } } as T; // Provide a conforming structure
  }
  if (response.status === 204 || response.status === 205 ) { // No Content or Reset Content
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
    body.sha = sha; // Required for updating existing files
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
      // console.warn(`[GitHub Lib] Could not fetch content for file: ${filePath}. Expected base64 encoded file content or file not found.`);
      return null;
    }
    return {
      content: Buffer.from(fileData.content, 'base64').toString('utf-8'),
      sha: fileData.sha,
    };
  } catch (error: any) {
    // fetchFromGitHub will return null for 404s, so we don't need special handling here anymore.
    // Re-throw other errors.
    console.error(`[GitHub Lib] Error fetching file content for '${filePath}':`, error);
    throw error;
  }
}


export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!owner || !repoName) {
    console.error('[GitHub Lib] GITHUB_REPO_OWNER or GITHUB_REPO_NAME not set.');
    return [];
  }

  let rootContents: GitHubFile[];
  try {
    rootContents = await fetchFromGitHub<GitHubFile[]>('contents/');
  } catch (error) {
    console.error('[GitHub Lib] Failed to fetch root contents:', error);
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
        // console.warn(`[GitHub Lib] Skipping novel '${novelId}': info.json not found or unreadable at path '${infoJsonFile.path}'.`);
        continue;
      }
      const { content: infoJsonContent, sha: infoJsonSha } = fileData;

      let info: InfoJson;
      try {
        info = JSON.parse(infoJsonContent);
      } catch (parseError: any) {
        console.error(`[GitHub Lib] Error parsing info.json for novel ${novelId} (path: ${infoJsonFile.path}): ${parseError.message}`);
        // console.error(`[GitHub Lib] Content of problematic info.json for ${novelId}:\n---\n${infoJsonContent}\n---`);
        console.warn(`[GitHub Lib] Skipping novel '${novelId}' due to invalid info.json.`);
        continue;
      }

      let coverImage: string;
      if (info.coverImageUrl && info.coverImageUrl.trim() !== '') {
        coverImage = info.coverImageUrl;
        // console.log(`[GitHub Lib] Novel '${novelId}': Using coverImageUrl from info.json: ${coverImage}`);
      } else {
        // console.warn(`[GitHub Lib] Novel '${novelId}': coverImageUrl not found or empty in info.json. Attempting to use 'cover.png'.`);
        // Attempt to construct URL for cover.png if coverImageUrl is missing
        // This part is tricky for private repos, for now, placeholder if not in info.json
        coverImage = `https://placehold.co/300x450.png?text=No+Cover`;
      }

      let novelContents: GitHubFile[];
      try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`);
      } catch (e) {
        console.warn(`[GitHub Lib] Could not fetch contents of novel directory '${novelPath}' to list chapters. Skipping chapter listing for '${novelId}'.`);
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
        // Basic title extraction from H1 if present
        // This is a simplified version; a more robust HTML parser might be needed for complex titles
        // For now, it's not fetching content here to avoid too many API calls.
        // If chapter content is needed for title, fetchChapter should be used.
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
        lastUpdateDate: info.fecha_lanzamiento,
        infoJsonSha: infoJsonSha,
        creatorId: info.creatorId, // Add creatorId
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
    const novelFolderPath = id;
    const infoJsonFilePath = `${novelFolderPath}/info.json`;

    const fileData = await fetchFileContent(infoJsonFilePath);
    if (!fileData) {
      // console.warn(`[GitHub Lib] Novel '${id}': info.json not found or unreadable at path '${infoJsonFilePath}'.`);
      return undefined;
    }
    const { content: infoJsonContent, sha: infoJsonSha } = fileData;

    let info: InfoJson;
    try {
      info = JSON.parse(infoJsonContent);
    } catch (parseError: any) {
      console.error(`[GitHub Lib] Error parsing info.json for novel '${id}' (path: '${infoJsonFilePath}'): ${parseError.message}`);
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
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelFolderPath}?ref=${DEFAULT_BRANCH}`);
    } catch (error: any) {
        if (error.message && error.message.includes('404') || error.message && error.message.includes('Not Found')) {
            // console.warn(`[GitHub Lib] Contents for novel with id '${id}' not found in GitHub repository (404). Path checked: 'contents/${novelFolderPath}'`);
            novelContents = [];
        } else {
          console.warn(`[GitHub Lib] Could not fetch contents of novel directory '${novelFolderPath}' to list chapters. Proceeding without chapters for '${id}'.`);
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
      summary: info.descripcion,
      coverImage: coverImage,
      chapters: chaptersMetadata,
      fecha_lanzamiento: info.fecha_lanzamiento,
      etiquetas: info.etiquetas,
      categoria: info.categoria,
      traductor: info.traductor,
      lastUpdateDate: info.fecha_lanzamiento,
      infoJsonSha: infoJsonSha,
      creatorId: info.creatorId, // Add creatorId
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
    const chapterFilePath = `${novelId}/${chapterId}.html`;
    const fileData = await fetchFileContent(chapterFilePath);
    if (!fileData || !fileData.content) {
        console.warn(`[GitHub Lib] Chapter content for '${chapterFilePath}' not found or unreadable.`);
        return undefined;
    }
    const chapterContent = fileData.content;

    let finalChapterTitle = chapterMeta.title;
    const h1Match = chapterContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
        finalChapterTitle = h1Match[1].trim();
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
    console.error(`[GitHub Lib] Error fetching chapter content for '${novelId}/${chapterId}':`, error);
    return undefined;
  }
}

export async function getFileSha(filePath: string): Promise<string | null> {
  try {
    const normalizedFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const fileData = await fetchFromGitHub<GitHubFile | null>(`contents/${normalizedFilePath}?ref=${DEFAULT_BRANCH}`);
    return fileData ? fileData.sha : null;
  } catch (error) {
    // console.warn(`[GitHub Lib] Could not get SHA for file ${filePath}:`, error);
    return null;
  }
}
