
'use server';

import { fetchFileContent } from '@/lib/github';
import type { Comment } from '@/lib/types';
import { fetchFromGitHub } from '@/lib/github';
import { revalidatePath } from 'next/cache';

const getCommentFilePath = (novelId: string, chapterId: string) => {
    // chapterId is like "chapter-123", so we just use it directly
    return `${novelId}/comments-${chapterId}.json`;
}

export async function fetchCommentsAction(novelId: string, chapterId: string): Promise<{ comments?: Comment[], error?: string }> {
    if (!novelId || !chapterId) {
        return { error: 'Se requieren el ID de la novela y del capítulo.' };
    }
    const filePath = getCommentFilePath(novelId, chapterId);
    try {
        const fileData = await fetchFileContent(filePath);
        if (!fileData) {
            return { comments: [] }; // File doesn't exist, return empty array
        }
        const comments: Comment[] = JSON.parse(fileData.content);
        return { comments: comments.sort((a, b) => b.timestamp - a.timestamp) };
    } catch (e: any) {
        if (e instanceof SyntaxError) {
             console.error(`Error parsing comments JSON for ${filePath}:`, e);
             return { error: 'El archivo de comentarios está corrupto. No se pueden cargar.' };
        }
        console.error(`Error fetching comments for ${filePath}:`, e);
        return { error: 'No se pudieron cargar los comentarios.' };
    }
}

export async function addCommentAction(novelId: string, chapterId: string, name: string, content: string): Promise<{ newComment?: Comment, error?: string }> {
    if (!novelId || !chapterId || !name.trim() || !content.trim()) {
        return { error: 'Todos los campos son obligatorios.' };
    }
    
    const filePath = getCommentFilePath(novelId, chapterId);
    let currentComments: Comment[] = [];
    let existingSha: string | undefined;

    try {
        const fileData = await fetchFileContent(filePath);
        if (fileData) {
            currentComments = JSON.parse(fileData.content);
            existingSha = fileData.sha;
        }
    } catch (e) {
        // Ignore if file doesn't exist or is corrupt, we'll overwrite it.
        console.warn(`Could not read or parse existing comments file at ${filePath}. A new file will be created. Error:`, e);
    }
    
    const newComment: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        content: content.trim(),
        timestamp: Date.now(),
    };

    const updatedComments = [...currentComments, newComment];
    const newJsonContent = JSON.stringify(updatedComments, null, 2);
    const newContentBase64 = Buffer.from(newJsonContent).toString('base64');
    
    const body: { message: string; content: string; sha?: string } = {
        message: `feat: Add comment to ${chapterId} in ${novelId}`,
        content: newContentBase64,
    };
    if (existingSha) {
        body.sha = existingSha;
    }
    
    try {
        const result = await fetchFromGitHub(`contents/${filePath}`, 'PUT', body, false, { cache: 'no-store' });
        if (result) {
            // Revalidate the path to ensure new comments can be fetched immediately
            revalidatePath(`/novels/${novelId}/chapters/${chapterId}`);
            return { newComment };
        } else {
            return { error: 'No se pudo guardar el comentario en GitHub.' };
        }
    } catch (e: any) {
        console.error(`Error writing comment to GitHub for ${filePath}:`, e);
        return { error: `No se pudo guardar el comentario: ${e.message}` };
    }
}
