import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, TextInput, TouchableOpacity, Image, Platform } from 'react-native';
import Colors from '@/constants/Colors';
import { Track } from '@/context/MusicContext';
import DefaultAlbumCover from './DefaultAlbumCover';
import { X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface EditSongModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track;
  onSave: (updatedTrack: Track) => void;
}

const EditSongModal: React.FC<EditSongModalProps> = ({ visible, onClose, track, onSave }) => {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album);
  const [artwork, setArtwork] = useState(track.artwork);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setArtwork(uri);
    }
  };

  const handleSave = () => {
    onSave({
      ...track,
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim(),
      artwork,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Edit Song</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.artworkContainer} onPress={handlePickImage}>
            {artwork ? (
              <Image source={{ uri: artwork }} style={styles.artwork} />
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

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: Colors.backgroundSecondary,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  artworkContainer: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginVertical: 24,
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
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
    marginTop: 8,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
    padding: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: Colors.background,
    borderRadius: 8,
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

export default EditSongModal;