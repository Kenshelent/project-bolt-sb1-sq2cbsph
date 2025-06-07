import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { Track } from '@/context/MusicContext';
import Colors from '@/constants/Colors';
import DefaultAlbumCover from './DefaultAlbumCover';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { MoveHorizontal as MoreHorizontal, Play, Share2, Info, Trash2 } from 'lucide-react-native';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import EditSongScreen from './EditSongScreen';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { router } from 'expo-router';

interface SongItemProps {
  track: Track;
  index: number;
  onPress: () => void;
  playlist?: Playlist;
}

const SongItem: React.FC<SongItemProps> = ({ track, index, onPress, playlist }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { deleteTrack } = usePlaybackStatus();
  const { removeTrackFromAllPlaylists, updatePlaylist } = usePlaylists();

  const handleShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(track.uri);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Song',
      'Are you sure you want to delete this song? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTrackFromAllPlaylists(track.id);
            await deleteTrack(track.id);
            setShowMenu(false);
          },
        },
      ]
    );
  };

  const handleInfo = () => {
    setShowMenu(false);
    router.push({ pathname: '/edit', params: { trackId: track.id } });
    if (playlist) {
      const updatedPlaylist = {
        ...playlist,
        tracks: playlist.tracks.map(t => 
          t.id === track.id ? track : t
        ),
      };
      updatePlaylist(updatedPlaylist);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.artwork}>
          {track.artwork ? (
            <Image source={{ uri: track.artwork }} style={styles.image} />
          ) : (
            <DefaultAlbumCover style={styles.image} />
          )}
        </View>
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MoreHorizontal size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <View style={styles.menuArtwork}>
                {track.artwork ? (
                  <Image source={{ uri: track.artwork }} style={styles.menuImage} />
                ) : (
                  <DefaultAlbumCover style={styles.menuImage} />
                )}
              </View>
              <View style={styles.menuTitleContainer}>
                <Text style={styles.menuTitle} numberOfLines={1}>{track.title}</Text>
                <Text style={styles.menuArtist} numberOfLines={1}>{track.artist}</Text>
              </View>
            </View>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={onPress}>
              <Play size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Play Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Share2 size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleInfo}>
              <Info size={20} color={Colors.text} />
              <Text style={styles.menuItemText}>Edit Info</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, styles.deleteButton]} 
              onPress={handleDelete}
            >
              <Trash2 size={20} color={Colors.tint} />
              <Text style={[styles.menuItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  artist: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  menuButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuArtwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuTitleContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  menuArtist: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text,
    marginLeft: 16,
  },
  deleteButton: {
    marginTop: 8,
  },
  deleteText: {
    color: Colors.tint,
  },
});

export default SongItem;