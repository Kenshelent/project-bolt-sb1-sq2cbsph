import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Track, MusicContext, trackEventEmitter } from './MusicContext';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  artwork?: string | null;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
}

interface CreatePlaylistOptions {
  name: string;
  artwork?: string | null;
  description?: string;
}

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (options: CreatePlaylistOptions) => Promise<Playlist>;
  updatePlaylist: (playlist: Playlist) => Promise<void>;
  removeTrackFromAllPlaylists: (trackId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

const PLAYLISTS_FILE = 'playlists.json';

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { addTracks, tracks } = useContext(MusicContext);

  useEffect(() => {
    const handleTrackUpdate = (updatedTrack: Track) => {
      const playlistsToUpdate = playlists.filter(playlist =>
        playlist.tracks.some(track => track.id === updatedTrack.id)
      );

      if (playlistsToUpdate.length > 0) {
        const updatedPlaylists = playlists.map(playlist => {
          if (playlistsToUpdate.some(p => p.id === playlist.id)) {
            return {
              ...playlist,
              tracks: playlist.tracks.map(track =>
                track.id === updatedTrack.id ? updatedTrack : track
              ),
              updatedAt: Date.now(),
            };
          }
          return playlist;
        });
        
        setPlaylists(updatedPlaylists);
        savePlaylists(updatedPlaylists).catch(console.error);
      }
    };

    trackEventEmitter.on('trackUpdated', handleTrackUpdate);
    
    return () => {
      trackEventEmitter.off('trackUpdated', handleTrackUpdate);
    };
  }, [playlists]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const filePath = FileSystem.documentDirectory + PLAYLISTS_FILE;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        setPlaylists(JSON.parse(content));
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const savePlaylists = async (updatedPlaylists: Playlist[]) => {
    try {
      const filePath = FileSystem.documentDirectory + PLAYLISTS_FILE;
      await FileSystem.writeAsStringAsync(
        filePath,
        JSON.stringify(updatedPlaylists)
      );
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Error saving playlists:', error);
    }
  };

  const createPlaylist = async (options: CreatePlaylistOptions) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name: options.name,
      description: options.description,
      artwork: options.artwork,
      tracks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const updatedPlaylists = [...playlists, newPlaylist];
    await savePlaylists(updatedPlaylists);
    return newPlaylist;
  };

  const updatePlaylist = async (updatedPlaylist: Playlist) => {
    const updatedPlaylists = playlists.map(playlist =>
      playlist.id === updatedPlaylist.id
        ? { 
            ...updatedPlaylist, 
            updatedAt: Date.now()
          }
        : playlist
    );
    setPlaylists(updatedPlaylists);
    await savePlaylists(updatedPlaylists);
  };

  const deletePlaylist = async (playlistId: string) => {
    const updatedPlaylists = playlists.filter(playlist => playlist.id !== playlistId);
    await savePlaylists(updatedPlaylists);
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track) => {
    // Find the track in the library first
    const existingTrack = tracks.find(t => t.id === track.id);
    
    // If the track doesn't exist in the library, add it
    if (!existingTrack) {
      await addTracks([track]);
    }
    
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        // Check if track already exists in playlist
        if (!playlist.tracks.some(t => t.id === track.id)) {
          // Use the existing track from library or the new track
          const trackToAdd = existingTrack || track;
          return {
            ...playlist,
            tracks: [...playlist.tracks, trackToAdd],
            updatedAt: Date.now(),
          };
        }
      }
      return playlist;
    });
    
    await savePlaylists(updatedPlaylists);
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const updatedPlaylists = playlists.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          tracks: playlist.tracks.filter(track => track.id !== trackId),
          updatedAt: Date.now(),
        };
      }
      return playlist;
    });
    await savePlaylists(updatedPlaylists);
  };

  const removeTrackFromAllPlaylists = async (trackId: string) => {
    const updatedPlaylists = playlists.map(playlist => ({
      ...playlist,
      tracks: playlist.tracks.filter(track => track.id !== trackId),
      updatedAt: Date.now(),
    }));
    await savePlaylists(updatedPlaylists);
  };

  const value = {
    playlists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    removeTrackFromAllPlaylists,
  };

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
};

export { PlaylistContext };