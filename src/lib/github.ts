import type { Novel, Chapter } from './types';

const GITHUB_API_BASE = 'https://api.github.com';
// Assuming 'main' as the default branch, can be made configurable if needed
const DEFAULT_BRANCH = 'main'; 

interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null; // Can be null for directories
  type: 'file' | 'dir';
  content?: string; // Base64 encoded content if it's a file and fetched directly
  encoding?: 'base64';
}

interface InfoJson {
  titulo: string;
  descripcion: string;
  fecha_lanzamiento?: string;
  etiquetas?: string[];
  categoria?: string;
  autor: string;
  traductor?: string;
}

async function fetchFromGitHub<T>(path: string): Promise<T> {
  const pat = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;

  if (!pat || !owner || !repo) {
    console.error('GitHub PAT, owner, or repo not configured in environment variables.');
    throw new Error('GitHub environment variables not set.');
  }

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/${path}`;
  const headers: HeadersInit = {
    'Authorization': `token ${pat}`,
    'Accept': 'application/vnd.github.v3+json',
  };

  const response = await fetch(url, { headers, next: { revalidate: 3600 } }); // Revalidate every hour

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    console.error(`GitHub API error for ${url}: ${response.status} - ${errorData.message}`);
    throw new Error(`Failed to fetch from GitHub: ${errorData.message || response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchFileContent(filePath: string): Promise<string> {
  const fileData = await fetchFromGitHub<GitHubFile>(`contents/${filePath}?ref=${DEFAULT_BRANCH}`);
  if (fileData.type !== 'file' || !fileData.content || fileData.encoding !== 'base64') {
    throw new Error(`Could not fetch content for file: ${filePath}. Expected base64 encoded file content.`);
  }
  return Buffer.from(fileData.content, 'base64').toString('utf-8');
}

function getRawContentUrl(filePath: string): string {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = process.env.GITHUB_REPO_NAME;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${DEFAULT_BRANCH}/${filePath}`;
}

export async function fetchNovels(): Promise<Novel[]> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!owner || !repoName) {
    console.error('GITHUB_REPO_OWNER or GITHUB_REPO_NAME not set.');
    return [];
  }

  const rootContents = await fetchFromGitHub<GitHubFile[]>('contents/');
  const novelDirs = rootContents.filter(item => item.type === 'dir');
  
  const novels: Novel[] = [];

  for (const dir of novelDirs) {
    try {
      const novelId = dir.name;
      const novelPath = dir.path;
      
      const novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${novelPath}?ref=${DEFAULT_BRANCH}`);
      
      const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
      if (!infoJsonFile) {
        console.warn(`Skipping novel ${novelId}: info.json not found.`);
        continue;
      }

      const infoJsonContent = await fetchFileContent(infoJsonFile.path);
      const info: InfoJson = JSON.parse(infoJsonContent);

      const coverImageFile = novelContents.find(f => f.name === 'cover.png' && f.type === 'file'); // Assuming cover.png
      const coverImage = coverImageFile ? getRawContentUrl(coverImageFile.path) : 'https://placehold.co/300x450.png?text=No+Cover';

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
          id: file.name.replace('.html', ''), // e.g. "chapter-1"
          title: `Chapter ${order}`, // Generic title
          order: order,
        };
      });
      
      novels.push({
        id: novelId,
        title: info.titulo,
        author: info.autor,
        summary: info.descripcion,
        coverImage: coverImage,
        githubRepoUrl: `https://github.com/${owner}/${repoName}/tree/${DEFAULT_BRANCH}/${novelPath}`,
        chapters: chaptersMetadata,
        fecha_lanzamiento: info.fecha_lanzamiento,
        etiquetas: info.etiquetas,
        categoria: info.categoria,
        traductor: info.traductor,
      });
    } catch (error) {
      console.error(`Error processing novel directory ${dir.name}:`, error);
    }
  }
  return novels;
}

export async function fetchNovelById(id: string): Promise<Novel | undefined> {
  const owner = process.env.GITHUB_REPO_OWNER;
  const repoName = process.env.GITHUB_REPO_NAME;

  if (!owner || !repoName) {
    console.error('GITHUB_REPO_OWNER or GITHUB_REPO_NAME not set.');
    return undefined;
  }
  
  try {
    // First, check if the directory exists by trying to fetch its contents.
    // GitHub API returns 404 if path doesn't exist.
    let novelContents: GitHubFile[];
    try {
        novelContents = await fetchFromGitHub<GitHubFile[]>(`contents/${id}?ref=${DEFAULT_BRANCH}`);
    } catch (error: any) {
        if (error.message && error.message.includes('404')) {
            console.warn(`Novel with id ${id} not found (404).`);
            return undefined;
        }
        throw error; // Re-throw other errors
    }


    const infoJsonFile = novelContents.find(f => f.name === 'info.json' && f.type === 'file');
    if (!infoJsonFile) {
      console.warn(`Novel ${id}: info.json not found.`);
      return undefined;
    }

    const infoJsonContent = await fetchFileContent(infoJsonFile.path);
    const info: InfoJson = JSON.parse(infoJsonContent);

    const coverImageFile = novelContents.find(f => f.name === 'cover.png' && f.type === 'file');
    const coverImage = coverImageFile ? getRawContentUrl(coverImageFile.path) : 'https://placehold.co/300x450.png?text=No+Cover';

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

    return {
      id: id,
      title: info.titulo,
      author: info.autor,
      summary: info.descripcion,
      coverImage: coverImage,
      githubRepoUrl: `https://github.com/${owner}/${repoName}/tree/${DEFAULT_BRANCH}/${id}`,
      chapters: chaptersMetadata,
      fecha_lanzamiento: info.fecha_lanzamiento,
      etiquetas: info.etiquetas,
      categoria: info.categoria,
      traductor: info.traductor,
    };

  } catch (error) {
    console.error(`Error fetching novel by id ${id}:`, error);
    return undefined;
  }
}

export async function fetchChapter(novelId: string, chapterId: string): Promise<{ novel: Novel; chapter: Chapter } | undefined> {
  const novel = await fetchNovelById(novelId);
  if (!novel) {
    return undefined;
  }

  // chapterId is expected to be like "chapter-1"
  const chapterMeta = novel.chapters.find(c => c.id === chapterId);
  if (!chapterMeta) {
    console.warn(`Chapter ${chapterId} not found in novel ${novelId}`);
    return undefined;
  }

  try {
    const chapterFilePath = `${novelId}/${chapterId}.html`; // e.g. "el-magnate/chapter-1.html"
    const chapterContent = await fetchFileContent(chapterFilePath);

    const fullChapter: Chapter = {
      id: chapterMeta.id,
      title: chapterMeta.title, // Using the generated title
      order: chapterMeta.order,
      content: chapterContent,
      path: chapterFilePath,
    };
    return { novel, chapter: fullChapter };
  } catch (error) {
    console.error(`Error fetching chapter content for ${novelId}/${chapterId}:`, error);
    return undefined;
  }
}
