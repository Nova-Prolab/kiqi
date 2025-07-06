'use server';

import { fetchFileContent } from '@/lib/github';
import type { Comment } from '@/lib/types';
import { fetchFromGitHub } from '@/lib/github';
import { revalidatePath } from 'next/cache';

const getCommentFilePath = (novelId: string, chapterId: string) => {
    return `${novelId}/comments-${chapterId}.json`;
}

// Helper function to find and mutate a comment in a nested structure
const findAndMutateComment = (
  comments: Comment[], 
  commentId: string, 
  mutation: (comment: Comment) => void
): boolean => {
    for (const comment of comments) {
        if (comment.id === commentId) {
            mutation(comment);
            return true;
        }
        if (comment.replies?.length > 0) {
            if (findAndMutateComment(comment.replies, commentId, mutation)) {
                return true;
            }
        }
    }
    return false;
};


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

async function getCommentsAndSha(novelId: string, chapterId: string): Promise<{ comments: Comment[], sha: string | undefined, error?: string }> {
    const filePath = getCommentFilePath(novelId, chapterId);
    let comments: Comment[] = [];
    let sha: string | undefined;
    try {
        const fileData = await fetchFileContent(filePath);
        if (fileData) {
            comments = JSON.parse(fileData.content);
            sha = fileData.sha;
        }
    } catch (e) {
        // Ignore if file doesn't exist, we'll create it.
    }
    return { comments, sha };
}

async function saveComments(novelId: string, chapterId: string, comments: Comment[], sha: string | undefined, commitMessage: string): Promise<{ success: boolean, error?: string }> {
    const filePath = getCommentFilePath(novelId, chapterId);
    const newJsonContent = JSON.stringify(comments, null, 2);
    const newContentBase64 = Buffer.from(newJsonContent).toString('base64');
    
    const body: { message: string; content: string; sha?: string } = {
        message: commitMessage,
        content: newContentBase64,
    };
    if (sha) {
        body.sha = sha;
    }

    try {
        await fetchFromGitHub(`contents/${filePath}`, 'PUT', body, false, { cache: 'no-store' });
        revalidatePath(`/novels/${novelId}/chapters/${chapterId}`);
        return { success: true };
    } catch (e: any) {
        console.error(`Error writing comments to GitHub for ${filePath}:`, e);
        return { error: `No se pudo guardar la acción: ${e.message}` };
    }
}

export async function addCommentAction(novelId: string, chapterId: string, name: string, content: string, avatarUrl?: string): Promise<{ newComment?: Comment, error?: string }> {
    if (!novelId || !chapterId || !name.trim() || !content.trim()) {
        return { error: 'Todos los campos son obligatorios.' };
    }
    
    const { comments: currentComments, sha } = await getCommentsAndSha(novelId, chapterId);
    
    const newComment: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        content: content.trim(),
        timestamp: Date.now(),
        avatarUrl: avatarUrl && avatarUrl.trim() !== '' ? avatarUrl.trim() : undefined,
        likes: 0,
        replies: [],
    };

    const updatedComments = [newComment, ...currentComments];
    const result = await saveComments(novelId, chapterId, updatedComments, sha, `feat: Add comment to ${chapterId} in ${novelId}`);
    
    if (result.success) {
        return { newComment };
    } else {
        return { error: result.error || 'No se pudo guardar el comentario en GitHub.' };
    }
}

export async function addReplyAction(novelId: string, chapterId: string, parentCommentId: string, name: string, content: string, avatarUrl?: string): Promise<{ newReply?: Comment, error?: string }> {
    if (!parentCommentId || !name.trim() || !content.trim()) {
        return { error: 'Faltan datos para la respuesta.' };
    }
    
    const { comments: currentComments, sha } = await getCommentsAndSha(novelId, chapterId);
    if (!sha) {
        return { error: 'No se puede responder en un hilo de comentarios que no existe.' };
    }
    
    const newReply: Comment = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        content: content.trim(),
        timestamp: Date.now(),
        avatarUrl: avatarUrl && avatarUrl.trim() !== '' ? avatarUrl.trim() : undefined,
        likes: 0,
        replies: [],
    };

    const foundAndMutated = findAndMutateComment(currentComments, parentCommentId, (parentComment) => {
        if (!parentComment.replies) {
            parentComment.replies = [];
        }
        parentComment.replies.unshift(newReply);
    });

    if (!foundAndMutated) {
        return { error: 'No se encontró el comentario padre para responder.' };
    }

    const result = await saveComments(novelId, chapterId, currentComments, sha, `feat: Add reply to comment ${parentCommentId}`);
    
    if (result.success) {
        return { newReply };
    } else {
        return { error: result.error || 'No se pudo guardar la respuesta.' };
    }
}

export async function likeCommentAction(novelId: string, chapterId: string, commentId: string): Promise<{ success?: boolean, error?: string }> {
    if (!commentId) {
        return { error: 'Se requiere el ID del comentario.' };
    }

    const { comments: currentComments, sha } = await getCommentsAndSha(novelId, chapterId);
     if (!sha) {
        return { error: 'No se puede dar Me Gusta en un hilo de comentarios que no existe.' };
    }
    
    const foundAndMutateComment = findAndMutateComment(currentComments, commentId, (comment) => {
        comment.likes = (comment.likes || 0) + 1;
    });

    if (!foundAndMutated) {
        return { error: 'No se encontró el comentario especificado.' };
    }

    const result = await saveComments(novelId, chapterId, currentComments, sha, `feat: Like comment ${commentId}`);
    
    return result;
}