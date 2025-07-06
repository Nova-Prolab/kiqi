
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type LikedCommentId = string;

interface LikedCommentsContextType {
  likedCommentIds: LikedCommentId[];
  addLikedComment: (commentId: LikedCommentId) => void;
  isCommentLiked: (commentId: LikedCommentId) => boolean;
  isLoaded: boolean;
}

const LikedCommentsContext = createContext<LikedCommentsContextType | undefined>(undefined);

const LIKED_COMMENTS_STORAGE_KEY = 'kiqiLikedComments';

export const LikedCommentsProvider = ({ children }: { children: ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<LikedCommentId[]>([]);

  useEffect(() => {
    try {
      const storedLikes = localStorage.getItem(LIKED_COMMENTS_STORAGE_KEY);
      if (storedLikes) {
        setLikedCommentIds(JSON.parse(storedLikes));
      }
    } catch (error) {
      console.warn('Could not load liked comments:', error);
      localStorage.removeItem(LIKED_COMMENTS_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveLikedComments = useCallback((ids: LikedCommentId[]) => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LIKED_COMMENTS_STORAGE_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error('Could not save liked comments:', error);
    }
  }, [isLoaded]);

  const addLikedComment = useCallback((commentId: LikedCommentId) => {
    setLikedCommentIds(prevIds => {
      const newIds = [...new Set([...prevIds, commentId])];
      saveLikedComments(newIds);
      return newIds;
    });
  }, [saveLikedComments]);

  const isCommentLiked = useCallback((commentId: LikedCommentId) => {
    return likedCommentIds.includes(commentId);
  }, [likedCommentIds]);

  const value = {
    likedCommentIds,
    addLikedComment,
    isCommentLiked,
    isLoaded,
  };

  return (
    <LikedCommentsContext.Provider value={value}>
      {children}
    </LikedCommentsContext.Provider>
  );
};

export const useLikedComments = () => {
  const context = useContext(LikedCommentsContext);
  if (context === undefined) {
    throw new Error('useLikedComments must be used within a LikedCommentsProvider');
  }
  return context;
};
