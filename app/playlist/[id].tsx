import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, FlatList, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { ChevronLeft, Play, Plus, Image as ImageIcon } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlaylists } from '@/hooks/usePlaylists';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import Animated from 'react-native-reanimated';
import SongItem from '@/components/SongItem';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Track } from '@/context/MusicContext';
import { parseBuffer } from 'music-metadata-browser';
import { toByteArray, fromByteArray } from 'base64-js';
import { saveArtworkToFile } from '@/utils/artworkStorage';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { TextInput } from 'react-native';
import NowPlayingBar from '@/components/NowPlayingBar';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playlists, updatePlaylist, addTrackToPlaylist } = usePlaylists();
  const { tracks, playTrack, currentTrack } = usePlaybackStatus();
  const playlist = playlists.find(p => p.id === id);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(playlist?.name || '');
  const [editArtwork, setEditArtwork] = useState<string | null>(playlist?.artwork || null);

  if (!playlist) {
    return null;
  }

  const handleEditPlaylist = async () => {
    if (editName.trim()) {
      const updatedPlaylist = {
        ...playlist,
        name: editName.trim(),
        artwork: editArtwork,
        updatedAt: Date.now(),
      };
      await updatePlaylist(updatedPlaylist);
      setShowEditModal(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setEditArtwork(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      const firstTrack = playlist.tracks[0];
      const globalIndex = tracks.findIndex(t => t.id === firstTrack.id);
      playTrack(firstTrack, globalIndex);
    }
  };

  const handleAddSong = async (track: Track) => {
    if (playlist) {
      await addTrackToPlaylist(playlist.id, track);
      setShowAddSongsModal(false);
    }
  };

  const handleUploadFiles = async () => {
    try {
      setIsUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      const musicDir = FileSystem.documentDirectory + 'music/';
      const dirInfo = await FileSystem.getInfoAsync(musicDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(musicDir);
      }

      const newTracks = await Promise.all(
        result.assets.map(async (file, index) => {
          try {
            const id = Date.now().toString() + index;
            const newUri = musicDir + file.name;
            
            const b64 = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });

            const uint8 = toByteArray(b64);
            const buffer = Buffer.from(uint8);

            const metadata = await parseBuffer(buffer, {
              mimeType: file.mimeType,
            });

            const { title, artist, album, year, picture } = metadata.common;
            let artwork = null;

            if (picture?.length) {
              const imgB64 = fromByteArray(picture[0].data);
              artwork = await saveArtworkToFile(picture[0].data, picture[0].format);
            }

            await FileSystem.copyAsync({
              from: file.uri,
              to: newUri,
            });
            
            const track = {
              id: `${Date.now()}-${Math.random().toString(36).substring(7)}-${index}`,
              title: title || file.name.replace(/\.[^/.]+$/, ''),
              artist: artist || 'Unknown Artist',
              album: album || 'Unknown Album',
              year: year || null,
              duration: metadata.format.duration * 1000 || 0,
              artwork,
              uri: newUri,
            };

            await addTrackToPlaylist(playlist.id, track);
            return track;
          } catch (error) {
            console.error('Error processing file:', error);
            Alert.alert('Error', `Failed to process ${file.name}`);
            return null;
          }
        })
      );

      const validTracks = newTracks.filter(track => track !== null);
      if (validTracks.length > 0) {
        Alert.alert('Success', `Added ${validTracks.length} tracks to the playlist`);
        setShowAddSongsModal(false);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      Alert.alert('Error', 'Failed to upload music files');
    } finally {
      setIsUploading(false);
    }
  };

  const availableTracks = tracks.filter(
    track => !playlist.tracks.some(t => t.id === track.id)
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Playlist</Text>
        
        <TouchableOpacity 
          onPress={() => {
            setEditName(playlist.name);
            setEditArtwork(playlist.artwork || null);
            setShowEditModal(true);
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.playlistHeader}>
          {playlist.artwork ? (
            <Image source={{ uri: playlist.artwork }} style={styles.artwork} />
          ) : (
            <DefaultAlbumCover style={styles.artwork} />
          )}
          
          <Text style={styles.playlistName}>{playlist.name}</Text>
          <Text style={styles.trackCount}>
            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
          </Text>
          
          <View style={styles.actions}>
            {playlist.tracks.length > 0 && (
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={handlePlayAll}
              >
                <Play size={20} color={Colors.white} />
                <Text style={styles.playButtonText}>Play All</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddSongsModal(true)}
            >
              <Plus size={20} color={Colors.text} />
              <Text style={styles.addButtonText}>Add Songs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={playlist.tracks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SongItem
              track={item}
              index={index}
              playlist={playlist}
              onPress={() => {
                const globalIndex = tracks.findIndex(t => t.id === item.id);
                playTrack(item, globalIndex);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent
          ]}
        />
      </View>

      {currentTrack && <NowPlayingBar />}

      <Modal
        visible={showAddSongsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSongsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Songs</Text>
              <TouchableOpacity 
                onPress={() => setShowAddSongsModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.uploadButton,
                isUploading && styles.uploadButtonDisabled
              ]}
              onPress={handleUploadFiles}
              disabled={isUploading}
            >
              <Plus size={20} color={Colors.text} />
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'Uploading...' : 'Upload from Files'}
              </Text>
            </TouchableOpacity>

            {availableTracks.length > 0 ? (
              <FlatList
                data={availableTracks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.songItem}
                    onPress={() => handleAddSong(item)}
                  >
                    {item.artwork ? (
                      <Image source={{ uri: item.artwork }} style={styles.songArtwork} />
                    ) : (
                      <DefaultAlbumCover style={styles.songArtwork} />
                    )}
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>{item.title}</Text>
                      <Text style={styles.songArtist}>{item.artist}</Text>
                    </View>
                    <Plus size={24} color={Colors.tint} />
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.modalList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No songs available to add. Upload new songs or add them to your library first.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Playlist</Text>
              <TouchableOpacity 
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.editArtworkButton} onPress={handlePickImage}>
              {editArtwork ? (
                <Image source={{ uri: editArtwork }} style={styles.editArtwork} />
              ) : (
                <DefaultAlbumCover style={styles.editArtwork} />
              )}
              <View style={styles.editArtworkOverlay}>
                <ImageIcon size={24} color={Colors.white} />
                <Text style={styles.editArtworkText}>Change Cover</Text>
              </View>
            </TouchableOpacity>

            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Playlist Name"
              placeholderTextColor={Colors.textSecondary}
            />

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleEditPlaylist}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.text,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.tint,
  },
  content: {
    flex: 1,
  },
  playlistHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  artwork: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  playlistName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  trackCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tint,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.white,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.text,
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: Colors.background,
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.tint,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    margin: 16,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  modalList: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  songArtwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  songArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  editArtworkButton: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginVertical: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editArtwork: {
    width: '100%',
    height: '100%',
  },
  editArtworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editArtworkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
    marginTop: 8,
  },
  editInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: Colors.tint,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
});