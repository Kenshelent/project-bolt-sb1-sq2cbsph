import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import * as FileSystem from 'expo-file-system';
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Buffer } from 'buffer';
import { parseBuffer } from 'music-metadata-browser';
import { toByteArray } from 'base64-js';
import { deleteArtworkFile, saveArtworkToFile } from '@/utils/artworkStorage';
import { Alert } from 'react-native';
import { EventEmitter } from 'events';

export const trackEventEmitter = new EventEmitter();

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: number | null;
  duration: number;
  artwork: string | null;
  uri: string;
}

interface MusicContextType {
  tracks: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackInstance: AudioPlayer | null;
  isShuffleMode: boolean;
  isRepeatMode: boolean;
  loadSavedTracks: () => Promise<void>;
  setCurrentTrackIndex: (index: number) => void;
  addTracks: (newTracks: Track[]) => Promise<void>;
  updateTrack: (updatedTrack: Track) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
  playTrack: (track: Track, index: number) => void;
  togglePlayPause: () => void;
  seekTo: (position: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  toggleShuffleMode: () => void;
  toggleRepeatMode: () => void;
}

export const MusicContext = createContext<MusicContextType | undefined>(undefined);

const TRACKS_METADATA_FILE = 'tracks_metadata.json';

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [playbackInstance, setPlaybackInstance] = useState<AudioPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isShuffleMode, setIsShuffleMode] = useState<boolean>(false);
  const [isRepeatMode, setIsRepeatMode] = useState<boolean>(false);
  const [playQueue, setPlayQueue] = useState<number[]>([]);

  // Subscribe to playback status updates
  useEffect(() => {
    if (!playbackInstance) return;
    
    const listener = playbackInstance.addListener(
      'playbackStatusUpdate',
      status => {
        if (!status.isLoaded) return;
        setPosition(status.currentTime * 1000);
        setDuration(status.duration * 1000);
        if (status.didJustFinish) {
          if (isRepeatMode) {
            playbackInstance.seekTo(0);
            playbackInstance.play();
          } else {
            playNextTrack();
          }
        }
      }
    );
    
    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    }
  }, [playbackInstance, isRepeatMode]);

  // Cleanup playback instance on unmount
  useEffect(() => {
    return () => {
      if (playbackInstance) {
        playbackInstance.pause();
        playbackInstance.unload();
      }
    };
  }, []);

  const saveMetadata = useCallback(async (data: Track[]) => {
    const path = FileSystem.documentDirectory + TRACKS_METADATA_FILE;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
  }, []);

  const loadSavedTracks = useCallback(async () => {
    const dir = FileSystem.documentDirectory + 'music/';
    const metaPath = FileSystem.documentDirectory + TRACKS_METADATA_FILE;
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(dir);
    try {
      const saved = JSON.parse(await FileSystem.readAsStringAsync(metaPath)) as Track[];
      const valid = (await Promise.all(
        saved.map(async t => (await FileSystem.getInfoAsync(t.uri)).exists ? t : null)
      )).filter(Boolean) as Track[];
      setTracks(valid);
      return;
    } catch {
      // no metadata, scan directory
    }
    const files = await FileSystem.readDirectoryAsync(dir);
    const audioFiles = files.filter(f => ['.mp3', '.m4a', '.wav', '.aac'].some(ext => f.endsWith(ext)));
    const scanned = await Promise.all(
      audioFiles.map(async (file, i) => {
        const uri = dir + file;
        try {
          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          const meta = await parseBuffer(Buffer.from(toByteArray(b64)));
          const { common, format } = meta;
          const pic = common.picture?.[0];
          let artwork = null;
          if (pic) {
            artwork = await saveArtworkToFile(pic.data, pic.format);
          }
          return {
            id: String(i),
            title: common.title || file.replace(/\.[^/.]+$/, ''),
            artist: common.artist || 'Unknown',
            album: common.album || 'Unknown',
            year: common.year || null,
            duration: (format.duration || 0) * 1000,
            artwork,
            uri,
          };
        } catch {
          return { id: String(i), title: file, artist: 'Unknown', album: 'Unknown', year: null, duration: 0, artwork: null, uri };
        }
      })
    );
    setTracks(scanned);
    await saveMetadata(scanned);
  }, [saveMetadata]);

  const addTracks = useCallback(async (newTracks: Track[]) => {
    const updated = [...tracks, ...newTracks];
    setTracks(updated);
    await saveMetadata(updated);
  }, [tracks, saveMetadata]);

  const updateTrack = useCallback(async (upd: Track) => {
    const updated = tracks.map(t => t.id === upd.id ? upd : t);
    setTracks(updated);
    if (currentTrackIndex >= 0 && tracks[currentTrackIndex].id === upd.id) {
      setCurrentTrackIndex(currentTrackIndex);
    }
    await saveMetadata(updated);
    trackEventEmitter.emit('trackUpdated', upd);
  }, [tracks, currentTrackIndex, saveMetadata]);

  const deleteTrack = useCallback(async (id: string) => {
    const idx = tracks.findIndex(t => t.id === id);
    if (idx < 0) return;
    if (idx === currentTrackIndex) playbackInstance?.pause();
    // Delete artwork file if exists
    if (tracks[idx].artwork) {
      await deleteArtworkFile(tracks[idx].artwork);
    }
    await FileSystem.deleteAsync(tracks[idx].uri);
    const updated = tracks.filter(t => t.id !== id);
    setTracks(updated);
    await saveMetadata(updated);
    setCurrentTrackIndex(prev => (prev > idx ? prev - 1 : -1));
  }, [tracks, currentTrackIndex, playbackInstance, saveMetadata]);

  const generatePlayQueue = useCallback((current: number) => {
    const idxs = tracks.map((_, i) => i);
    const queue = isShuffleMode ? idxs.sort(() => Math.random() - 0.5) : idxs;
    setPlayQueue(queue);
    return queue;
  }, [tracks, isShuffleMode]);

  const playTrack = useCallback((track: Track, idx: number) => {
    if(playbackInstance) {
      playbackInstance?.replace(track);
      playbackInstance?.play();
    } else {
      const player = createAudioPlayer({ uri: track.uri }, 1000);
      player.play();
      setPlaybackInstance(player);
    }
  
    
    // const player = createAudioPlayer({ uri: track.uri }, 1000);
    // player.play();
    // setPlaybackInstance(player);
    setIsPlaying(true);
    setCurrentTrackIndex(idx);
    generatePlayQueue(idx);
  }, [playbackInstance, generatePlayQueue]);

  const togglePlayPause = useCallback(() => {
    if (!playbackInstance) return;
    if (isPlaying) playbackInstance.pause(); else playbackInstance.play();
    setIsPlaying(prev => !prev);
  }, [playbackInstance, isPlaying]);

  const seekTo = useCallback((ms: number) => {
    playbackInstance?.seekTo(ms / 1000);
    setPosition(ms);
  }, [playbackInstance]);

  const playNextTrack = useCallback(() => {
    if (!playQueue.length) return;
    const pos = playQueue.indexOf(currentTrackIndex);
    const nextIdx = playQueue[(pos + 1) % playQueue.length];
    playTrack(tracks[nextIdx], nextIdx);
  }, [playQueue, currentTrackIndex, playTrack, tracks]);

  const playPreviousTrack = useCallback(() => {
    if (position > 3000) { seekTo(0); return; }
    if (!playQueue.length) return;
    const pos = playQueue.indexOf(currentTrackIndex);
    const prevIdx = playQueue[(pos - 1 + playQueue.length) % playQueue.length];
    playTrack(tracks[prevIdx], prevIdx);
  }, [playQueue, currentTrackIndex, position, seekTo, playTrack, tracks]);

  const toggleShuffleMode = useCallback(() => setIsShuffleMode(prev => !prev), []);
  const toggleRepeatMode = useCallback(() => setIsRepeatMode(prev => !prev), []);

  const currentTrack = useMemo(() => tracks[currentTrackIndex] || null, [tracks, currentTrackIndex]);

  const value = useMemo<MusicContextType>(() => ({
    tracks,
    currentTrack,
    currentTrackIndex,
    setCurrentTrackIndex,
    isPlaying,
    position,
    duration,
    playbackInstance,
    isShuffleMode,
    isRepeatMode,
    loadSavedTracks,
    addTracks,
    updateTrack,
    deleteTrack,
    playTrack,
    togglePlayPause,
    seekTo,
    playNextTrack,
    playPreviousTrack,
    toggleShuffleMode,
    toggleRepeatMode,
  }), [
    tracks,
    currentTrack,
    currentTrackIndex,
    setCurrentTrackIndex,
    isPlaying,
    position,
    duration,
    playbackInstance,
    isShuffleMode,
    isRepeatMode,
    loadSavedTracks,
    addTracks,
    updateTrack,
    deleteTrack,
    playTrack,
    togglePlayPause,
    seekTo,
    playNextTrack,
    playPreviousTrack,
    toggleShuffleMode,
    toggleRepeatMode,
  ]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};