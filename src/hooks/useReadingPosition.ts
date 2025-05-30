"use client";

import { useCallback, useEffect, useState } from 'react';

export function useReadingPosition(chapterKey: string) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const savePosition = useCallback((position: number) => {
    if (!isMounted || !chapterKey) return;
    try {
      localStorage.setItem(`reading_pos_${chapterKey}`, position.toString());
    } catch (error) {
      console.warn("Error saving reading position:", error);
    }
  }, [chapterKey, isMounted]);

  const loadPosition = useCallback((): number | null => {
    if (!isMounted || !chapterKey) return null;
    try {
      const position = localStorage.getItem(`reading_pos_${chapterKey}`);
      return position ? parseInt(position, 10) : null;
    } catch (error) {
      console.warn("Error loading reading position:", error);
      return null;
    }
  }, [chapterKey, isMounted]);

  return { savePosition, loadPosition };
}
