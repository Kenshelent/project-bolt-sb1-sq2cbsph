import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import Colors from '@/constants/Colors';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { saveBase64ArtworkToFile, deleteArtworkFile } from '@/utils/artworkStorage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlaylists } from '@/hooks/usePlaylists';
import { FontFamily, FontSize, Spacing, Button } from '@/constants/Theme';

export default function EditSongScreen() {
  const { trackId } = useLocalSearchParams<{ trackId: string }>();
  const { tracks, updateTrack } = usePlaybackStatus();
  const { playlists, updatePlaylist } = usePlaylists();
  const track = tracks.find(t => t.id === trackId);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [artwork, setArtwork] = useState<string | null>(null);

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist);
      setAlbum(track.album);
      setArtwork(track.artwork);
    }
  }, [track]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // Delete old artwork file if exists
        if (artwork) {
          await deleteArtworkFile(artwork);
        }
        
        const uri = await saveBase64ArtworkToFile(
          `data:image/jpeg;base64,${result.assets[0].base64}`
        );
        setArtwork(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  if (!track) {
    return null;
  }

  const handleSave = async () => {
    if (!track) return;

    const updatedTrack: Track = {
      ...track,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim(),
      artwork,
    };

    // First update the track in the library
    await updateTrack(updatedTrack);

    // Then update all playlists that contain this track
    const playlistsToUpdate = playlists.filter(p => 
      p.tracks.some(t => t.id === track.id)
    );

    await Promise.all(playlistsToUpdate.map(playlist => {
      const updatedTracks = playlist.tracks.map(t => 
        t.id === track.id ? updatedTrack : t
      );
      return updatePlaylist({
        ...playlist,
        tracks: updatedTracks,
      });
    }));

    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Song</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.artworkContainer} onPress={handlePickImage}>
          {artwork ? (
            <Image 
              source={{ uri: artwork }} 
              style={styles.artwork}
              resizeMode="cover"
            />
          ) : (
            <DefaultAlbumCover style={styles.artwork} />
          )}
          <View style={styles.artworkOverlay}>
            <ImageIcon size={24} color={Colors.white} />
            <Text style={styles.changeArtworkText}>Change Artwork</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Song title"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Artist</Text>
            <TextInput
              style={styles.input}
              value={artist}
              onChangeText={setArtist}
              placeholder="Artist name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Album</Text>
            <TextInput
              style={styles.input}
              value={album}
              onChangeText={setAlbum}
              placeholder="Album name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.text,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -4,
  },
  saveButton: {
    paddingVertical: Button.paddingVertical,
    paddingHorizontal: Button.paddingHorizontal,
  },
  saveButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.tint,
  },
  content: {
    flex: 1,
  },
  artworkContainer: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: Spacing.xl,
    borderRadius: 8,
    overflow: 'hidden',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeArtworkText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  form: {
    padding: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.text,
    padding: Platform.OS === 'ios' ? Spacing.md : Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
  },
});