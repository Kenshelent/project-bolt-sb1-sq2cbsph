import { useContext } from 'react';
import { MusicContext } from '@/context/MusicContext';
import type { MusicContextType } from '@/context/MusicContext';

export function useMusic(): MusicContextType {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}

export const usePlaybackStatus = useMusic;