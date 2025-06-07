import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Image, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Plus, ListMusic, ChevronRight, Image as ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { usePlaylists } from '@/hooks/usePlaylists';
import * as ImagePicker from 'expo-image-picker';

export default function PlaylistsScreen() {
  const { playlists, createPlaylist } = usePlaylists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setSelectedImage(uri);
    }
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await createPlaylist({
        name: newPlaylistName.trim(),
        artwork: selectedImage,
      });
      setShowCreateModal(false);
      setNewPlaylistName('');
      setSelectedImage(null);
    }
  };

  const renderPlaylistItem = ({ item: playlist }) => (
    <TouchableOpacity 
      style={styles.playlistItem}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
    >
      {playlist.artwork ? (
        <Image source={{ uri: playlist.artwork }} style={styles.playlistArtwork} />
      ) : (
        <View style={[styles.playlistArtwork, styles.placeholderArtwork]}>
          <ListMusic size={24} color={Colors.textSecondary} />
        </View>
      )}
      
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistCount}>
          {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
        </Text>
      </View>
      
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Playlists</Text>
        
        <TouchableOpacity 
          style={styles.playlistItem}
          onPress={() => setShowCreateModal(true)}
        >
          <View style={[styles.playlistArtwork, styles.placeholderArtwork]}>
            <Plus size={24} color={Colors.textSecondary} />
          </View>
          
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistName}>Create New Playlist</Text>
            <Text style={styles.playlistCount}>Add your favorite songs</Text>
          </View>
          
          <ChevronRight size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Playlist</Text>

            <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImageIcon size={32} color={Colors.textSecondary} />
                  <Text style={styles.imagePickerText}>Choose Cover Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Playlist Name"
              placeholderTextColor={Colors.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]} 
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 34,
    color: Colors.text,
    marginTop: 8,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playlistArtwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  placeholderArtwork: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    marginLeft: 16,
    flex: 1,
  },
  playlistName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  playlistCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  imagePickerButton: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  createButton: {
    backgroundColor: Colors.tint,
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text,
  },
  createButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});