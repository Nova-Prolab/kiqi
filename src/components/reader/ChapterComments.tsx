
'use client';

import { useState, useTransition, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Comment } from '@/lib/types';
import { addCommentAction, fetchCommentsAction, addReplyAction, likeCommentAction } from '@/actions/commentActions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, AlertTriangle, Send, Heart, MessageSquare, Maximize, Minimize, Crown, Star, Award, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReaderSettings } from '@/contexts/ReaderSettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useLikedComments } from '@/contexts/LikedCommentsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function ChapterComments({ novelId, chapterId, isOpen, onOpenChange }: ChapterCommentsProps) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [isLoading, startLoadingTransition] = useTransition();
  const [isSubmitting, startSubmittingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const { commentAuthorName, setCommentAuthorName, commentAuthorAvatar } = useReaderSettings();
  const { isCommentLiked, addLikedComment, isLoaded: likedCommentsLoaded } = useLikedComments();
  const { toast } = useToast();

  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [tempName, setTempName] = useState('');

  const handleLoadComments = useCallback(() => {
    startLoadingTransition(async () => {
      setError(null);
      const result = await fetchCommentsAction(novelId, chapterId);
      if (result.comments) {
        setComments(result.comments);
      } else {
        setError(result.error || 'No se pudieron cargar los comentarios.');
      }
    });
  }, [novelId, chapterId]);

  useEffect(() => {
    if (isOpen && comments === null) {
      handleLoadComments();
    }
  }, [isOpen, comments, handleLoadComments]);

  const publishComment = useCallback((authorName: string, content: string) => {
    startSubmittingTransition(async () => {
      const originalComments = comments;
      const optimisticComment: Comment = {
        id: `temp-${Date.now()}`,
        name: authorName, content, avatarUrl: commentAuthorAvatar,
        timestamp: Date.now(), likes: 0, replies: [],
      };
      setComments([optimisticComment, ...(comments || [])]);
      setCommentText('');

      const result = await addCommentAction(novelId, chapterId, authorName, content, commentAuthorAvatar);
      
      if (result.newComment) {
        setComments(prev => (prev || []).map(c => c.id === optimisticComment.id ? result.newComment! : c));
        toast({ title: '¡Comentario Publicado!' });
      } else {
        setComments(originalComments);
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      }
    });
  }, [comments, commentAuthorAvatar, novelId, chapterId, toast]);

  const handleAddTopLevelComment = (e: FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El comentario no puede estar vacío.' });
      return;
    }
    if (!commentAuthorName?.trim()) {
      setTempName('');
      setIsNameModalOpen(true);
      return;
    }
    publishComment(commentAuthorName, commentText);
  };
  
  const handleNameModalSubmit = () => {
    if (!tempName.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'El nombre es obligatorio.' });
      return;
    }
    setCommentAuthorName(tempName);
    setIsNameModalOpen(false);
    publishComment(tempName, commentText);
    setTempName('');
  };

  const handleLike = (commentId: string) => {
    if (!likedCommentsLoaded) return;
    if (isCommentLiked(commentId)) {
      toast({ title: "Acción repetida", description: "Ya has indicado que te gusta este comentario." });
      return;
    }
    
    const originalComments = comments;
    setComments(prev => prev ? updateLikesInTree(prev, commentId) : null);

    startSubmittingTransition(async () => {
      const result = await likeCommentAction(novelId, chapterId, commentId);
      if (result.success) {
        addLikedComment(commentId);
      } else {
        setComments(originalComments);
        toast({ variant: 'destructive', title: 'Error', description: `No se pudo dar Me Gusta: ${result.error}` });
      }
    });
  };

  const handleAddReply = (parentId: string, replyContent: string) => {
    const authorName = commentAuthorName || 'Anónimo'; // Fallback
    if (!replyContent.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'La respuesta no puede estar vacía.'});
      return;
    }
    if (!commentAuthorName?.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes configurar un nombre en las opciones globales para poder responder.' });
      return;
    }

    startSubmittingTransition(async () => {
        const originalComments = comments;
        const optimisticReply: Comment = {
            id: `temp-reply-${Date.now()}`,
            name: authorName, content: replyContent, avatarUrl: commentAuthorAvatar,
            timestamp: Date.now(), likes: 0, replies: [],
        };
        setComments(prev => prev ? addReplyInTree(prev, parentId, optimisticReply) : null);
        setReplyingTo(null);

        const result = await addReplyAction(novelId, chapterId, parentId, authorName, replyContent, commentAuthorAvatar);
        
        if (result.newReply) {
            setComments(prev => {
                const newComments = [...(prev || [])];
                findAndMutateComment(newComments, optimisticReply.id, (comment) => {
                    Object.assign(comment, result.newReply);
                });
                return newComments;
            });
        } else {
            setComments(originalComments);
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo responder: ${result.error}` });
        }
    });
  };

  const topCommentsMap = useMemo(() => {
    if (!comments || comments.length < 1) {
        return new Map<string, number>();
    }
    const sortedByLikes = [...comments].filter(c => c.likes > 0).sort((a, b) => b.likes - a.likes);
    const rankMap = new Map<string, number>();
    if (sortedByLikes[0]) rankMap.set(sortedByLikes[0].id, 1);
    if (sortedByLikes[1]) rankMap.set(sortedByLikes[1].id, 2);
    if (sortedByLikes[2]) rankMap.set(sortedByLikes[2].id, 3);
    return rankMap;
  }, [comments]);
  
  const sortedComments = useMemo(() => {
    if (!comments) return null;
    const topCommentIds = Array.from(topCommentsMap.keys());
    const top = comments.filter(c => topCommentIds.includes(c.id)).sort((a, b) => (topCommentsMap.get(a.id) || 4) - (topCommentsMap.get(b.id) || 4));
    const rest = comments.filter(c => !topCommentIds.includes(c.id));
    return [...top, ...rest];
  }, [comments, topCommentsMap]);


  const CommentItem = ({ comment, level, highlightRank }: { comment: Comment; level: number, highlightRank?: number }) => {
    const [isReplySubmitting, startReplyTransition] = useTransition();
    const hasLiked = isCommentLiked(comment.id);

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
    
    const highlightClasses = {
        1: 'bg-amber-100/50 dark:bg-amber-900/30 border-amber-400/80', // Gold
        2: 'bg-slate-100/50 dark:bg-slate-800/30 border-slate-400/70', // Silver
        3: 'bg-orange-100/30 dark:bg-orange-900/20 border-orange-400/50' // Bronze
    };

    const highlightBadge = {
        1: { icon: Crown, text: 'Comentario Destacado', class: 'text-amber-600 dark:text-amber-400' },
        2: { icon: Star, text: 'Popular', class: 'text-slate-600 dark:text-slate-400' },
        3: { icon: Award, text: 'Reconocido', class: 'text-orange-600 dark:text-orange-400' }
    };

    const BadgeIcon = highlightRank ? highlightBadge[highlightRank as keyof typeof highlightBadge]?.icon : null;
    const badgeInfo = highlightRank ? highlightBadge[highlightRank as keyof typeof highlightBadge] : null;

    return (
       <div className={cn("flex items-start gap-3 sm:gap-4", level > 0 ? "mt-4" : "")}>
          <Avatar className="mt-1 h-10 w-10">
            <AvatarImage src={comment.avatarUrl} alt={comment.name} />
            <AvatarFallback>{comment.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-grow">
              <div className={cn("rounded-lg px-4 py-3 border transition-all", highlightRank ? highlightClasses[highlightRank as keyof typeof highlightClasses] : 'bg-muted/40 border-transparent')}>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-foreground">{comment.name}</p>
                        <p className="text-xs text-muted-foreground">
                            · {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                     {badgeInfo && BadgeIcon && (
                        <Badge variant="outline" className={cn('text-xs font-medium border-none', badgeInfo.class)}>
                            <BadgeIcon className="mr-1.5 h-3.5 w-3.5" /> {badgeInfo.text}
                        </Badge>
                     )}
                  </div>
                  <p className="text-foreground/90 mt-1 whitespace-pre-wrap text-sm sm:text-base">{comment.content}</p>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground font-medium">
                  <button onClick={() => handleLike(comment.id)} disabled={!likedCommentsLoaded} className="flex items-center gap-1.5 group hover:text-red-500 transition-colors disabled:cursor-not-allowed">
                      <Heart size={14} className={cn('transition-colors', hasLiked ? "fill-red-500 text-red-500" : "group-hover:text-red-500")} />
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
                          <AvatarImage src={commentAuthorAvatar} alt={commentAuthorName || 'Tu'} />
                          <AvatarFallback>{(commentAuthorName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow space-y-2">
                         <Textarea name="replyContent" placeholder={`Respondiendo a ${comment.name}...`} required rows={2} className="bg-background"/>
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center py-8 text-destructive bg-destructive/10 rounded-md p-6">
            <AlertTriangle className="mx-auto h-8 w-8 mb-3" />
            <p className="font-semibold">Error al cargar</p>
            <p className="text-sm mt-1 mb-4 max-w-xs mx-auto">{error}</p>
            <Button variant="outline" onClick={handleLoadComments}>Intentar de Nuevo</Button>
          </div>
        </div>
      );
    }
    
    if (sortedComments) {
      return (
        <ScrollArea className="flex-grow h-full">
          <div className="p-4 sm:p-6 space-y-8">
            {sortedComments.length > 0 ? (
              sortedComments.map(comment => <CommentItem key={comment.id} comment={comment} level={0} highlightRank={topCommentsMap.get(comment.id)} />)
            ) : (
              <p className="text-center text-muted-foreground py-12">Sé el primero en comentar.</p>
            )}
          </div>
        </ScrollArea>
      );
    }
    
    return null; // Should not happen if logic is correct
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className={cn(
            'mt-16 flex h-[85vh] flex-col gap-0 p-0 transition-all duration-300 ease-in-out z-[160]',
            isMaximized && 'h-screen'
          )}
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent autofocus on first element
        >
          <SheetHeader className="flex-shrink-0 flex-row items-center justify-between gap-4 border-b p-3 sm:p-4">
            <div className="flex-1 space-y-1">
              <SheetTitle className="flex items-center text-primary">
                <MessageCircle className="mr-3 h-6 w-6" />
                Comentarios
              </SheetTitle>
              <SheetDescription className="hidden sm:block">
                Lee lo que otros piensan o comparte tu propia opinión.
              </SheetDescription>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMaximized(!isMaximized)}
                className="hidden sm:inline-flex"
              >
                {isMaximized ? <Minimize className="h-5 w-5"/> : <Maximize className="h-5 w-5"/>}
                <span className="sr-only">{isMaximized ? 'Restaurar' : 'Maximizar'}</span>
              </Button>
              <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Cerrar</span>
                  </Button>
              </SheetClose>
            </div>
          </SheetHeader>

          <div className="flex-grow min-h-0 flex flex-col">
            {renderContent()}
          </div>

          {comments && !error && (
            <div className="flex-shrink-0 border-t bg-background p-3 sm:p-4">
                <form onSubmit={handleAddTopLevelComment} className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={commentAuthorAvatar} alt={commentAuthorName || 'Tu'} />
                    <AvatarFallback>{(commentAuthorName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="w-full space-y-3">
                    <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Añade tu comentario..."
                    required
                    rows={2}
                    className="bg-muted text-base"
                    />
                    <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSubmitting ? 'Publicando...' : 'Publicar'}
                    </Button>
                    </div>
                </div>
                </form>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
          <DialogContent className="sm:max-w-md">
              <DialogHeader>
                  <DialogTitle>¿Cómo te llamas?</DialogTitle>
                  <DialogDescription>
                      Necesitas un nombre para poder comentar. Este se guardará para futuras ocasiones.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                          Nombre
                      </Label>
                      <Input 
                          id="name" 
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="col-span-3"
                          placeholder="Tu apodo"
                          onKeyDown={(e) => { if (e.key === 'Enter') handleNameModalSubmit(); }}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNameModalOpen(false)}>Cancelar</Button>
                  <Button onClick={handleNameModalSubmit}>Guardar y Publicar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
}
