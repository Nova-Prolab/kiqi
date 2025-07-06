
'use client';

import { useState, useTransition, useEffect, useCallback, FormEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Comment } from '@/lib/types';
import { addCommentAction, fetchCommentsAction, addReplyAction, likeCommentAction } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, AlertTriangle, Send, Heart, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


// Helper functions for optimistic updates
const updateLikesInTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments.map(c => {
        if (c.id === commentId) {
            return { ...c, likes: (c.likes || 0) + 1 };
        }
        if (c.replies?.length > 0) {
            return { ...c, replies: updateLikesInTree(c.replies, commentId) };
        }
        return c;
    });
};

const addReplyInTree = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(c => {
        if (c.id === parentId) {
            const updatedReplies = [newReply, ...(c.replies || [])];
            return { ...c, replies: updatedReplies };
        }
        if (c.replies?.length > 0) {
            return { ...c, replies: addReplyInTree(c.replies, parentId, newReply) };
        }
        return c;
    });
};


interface ChapterCommentsProps {
  novelId: string;
  chapterId: string;
}

export default function ChapterComments({ novelId, chapterId }: ChapterCommentsProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [isLoading, startLoadingTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const { commentAuthorName, setCommentAuthorName, commentAuthorAvatar } = useReaderSettings();
  const [name, setName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (commentAuthorName) {
      setName(commentAuthorName);
    }
  }, [commentAuthorName]);
  
  const handleLoadComments = () => {
    startLoadingTransition(async () => {
      setError(null);
      const result = await fetchCommentsAction(novelId, chapterId);
      if (result.comments) {
        setComments(result.comments);
      } else {
        setError(result.error || 'No se pudieron cargar los comentarios.');
      }
    });
  };

  const handleAddTopLevelComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commentText.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nombre y comentario son obligatorios.' });
      return;
    }
    
    startSubmittingTransition(async () => {
      const originalComments = comments;
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        name, content: commentText, avatarUrl: commentAuthorAvatar,
        timestamp: Date.now(), likes: 0, replies: [],
      };
      setComments([optimisticComment, ...(comments || [])]);
      setCommentText('');

      const result = await addCommentAction(novelId, chapterId, name, commentText, commentAuthorAvatar);
      
      if (result.newComment) {
        setComments(prev => (prev || []).map(c => c.id === optimisticComment.id ? result.newComment! : c));
        toast({ title: '¡Comentario Publicado!' });
      } else {
        setComments(originalComments);
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  };

  const handleLike = (commentId: string) => {
    const originalComments = comments;
    setComments(prev => prev ? updateLikesInTree(prev, commentId) : null);

    startSubmittingTransition(async () => {
      const result = await likeCommentAction(novelId, chapterId, commentId);
      if (result.error) {
          setComments(originalComments);
          toast({ variant: 'destructive', title: 'Error', description: `No se pudo dar Me Gusta: ${result.error}`});
      }
    });
  };

  const handleAddReply = (parentId: string, replyContent: string) => {
    if (!name.trim() || !replyContent.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nombre y comentario son obligatorios.'});
      return;
    }

    startSubmittingTransition(async () => {
        const originalComments = comments;
        const optimisticReply: Comment = {
            id: `temp-reply-${Date.now()}`,
            name, content: replyContent, avatarUrl: commentAuthorAvatar,
            timestamp: Date.now(), likes: 0, replies: [],
        };
        setComments(prev => prev ? addReplyInTree(prev, parentId, optimisticReply) : null);
        setReplyingTo(null);

        const result = await addReplyAction(novelId, chapterId, parentId, name, replyContent, commentAuthorAvatar);
        
        if (result.newReply) {
            setComments(prev => (prev || []).map(c => {
                const newC = { ...c };
                findAndMutateComment([newC], optimisticReply.id, (comment) => {
                    Object.assign(comment, result.newReply);
                });
                return newC;
            }));
        } else {
            setComments(originalComments);
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo responder: ${result.error}` });
        }
    });
  };


  const CommentItem = ({ comment, level }: { comment: Comment; level: number }) => {
    const [isReplySubmitting, startReplyTransition] = useTransition();

    const onReplySubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const contentInput = form.elements.namedItem('replyContent') as HTMLTextAreaElement;
      const content = contentInput.value;
      if (content.trim()) {
        startReplyTransition(() => {
            handleAddReply(comment.id, content);
            contentInput.value = '';
        });
      }
    };
    
    return (
       <div className={cn("flex items-start gap-3 sm:gap-4", level > 0 && "mt-4")}>
          <Avatar className="mt-1">
            <AvatarImage src={comment.avatarUrl} alt={comment.name} />
            <AvatarFallback>{comment.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
              <div className="bg-muted/40 rounded-lg px-4 py-3">
                  <div className="flex items-baseline gap-2">
                      <p className="font-semibold text-foreground">{comment.name}</p>
                      <p className="text-xs text-muted-foreground">
                          · {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                      </p>
                  </div>
                  <p className="text-foreground/90 mt-1 whitespace-pre-wrap text-sm sm:text-base">{comment.content}</p>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <button onClick={() => handleLike(comment.id)} className="flex items-center gap-1.5 group hover:text-red-500 transition-colors">
                      <Heart size={14} className="group-hover:fill-red-500" />
                      <span>{comment.likes || 0}</span>
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <MessageSquare size={14} />
                      <span>Responder</span>
                  </button>
              </div>

              {replyingTo === comment.id && (
                  <form onSubmit={onReplySubmit} className="mt-3 flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={commentAuthorAvatar} alt={name || 'Tu'} />
                          <AvatarFallback>{(name || '?').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow space-y-2">
                         <Textarea name="replyContent" placeholder="Escribe una respuesta..." required rows={2} className="bg-background"/>
                         <div className="flex justify-end gap-2">
                             <Button type="button" variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancelar</Button>
                             <Button type="submit" size="sm" disabled={isReplySubmitting}>
                                 {isReplySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                 Responder
                             </Button>
                         </div>
                      </div>
                  </form>
              )}
              
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-4">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} level={level + 1} />
                        ))}
                    </div>
                </div>
              )}
          </div>
      </div>
    );
  };


  return (
    <Card className="shadow rounded-lg border mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-primary text-xl sm:text-2xl">
          <MessageCircle className="mr-3 h-6 w-6" />
          Comentarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {comments === null ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Los comentarios para este capítulo no se han cargado.</p>
            <Button onClick={handleLoadComments} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
              {isLoading ? 'Cargando...' : 'Cargar Comentarios'}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : error ? (
           <div className="text-center py-8 text-destructive bg-destructive/10 rounded-md">
              <AlertTriangle className="mx-auto h-8 w-8 mb-3" />
              <p className="font-semibold">Error al cargar</p>
              <p className="text-sm mt-1 mb-4">{error}</p>
              <Button variant="outline" onClick={handleLoadComments}>Intentar de Nuevo</Button>
            </div>
        ) : (
          <div className="space-y-8">
            <form onSubmit={handleAddTopLevelComment} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={commentAuthorAvatar} alt={name || 'Tu'} />
                <AvatarFallback>{(name || '?').charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="w-full space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setCommentAuthorName(e.target.value)}
                  placeholder="Tu nombre o apodo..."
                  required
                  className="font-semibold bg-background"
                />
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe tu comentario aquí..."
                  required
                  rows={3}
                  className="bg-background"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </form>
            
            <div className="space-y-6">
                {comments.length > 0 ? (
                    comments.map(comment => <CommentItem key={comment.id} comment={comment} level={0} />)
                ) : (
                    <p className="text-center text-muted-foreground py-6">Sé el primero en comentar.</p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
