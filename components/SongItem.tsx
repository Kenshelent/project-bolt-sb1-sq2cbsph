import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal, Pressable } from 'react-native';
import { Track } from '@/context/MusicContext';
import Colors from '@/constants/Colors';
import DefaultAlbumCover from './DefaultAlbumCover';
import { usePlaylists, Playlist } from '@/hooks/usePlaylists';
import { MoreHorizontal, Play, Share2, Info, Trash2 } from 'lucide-react-native';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import EditSongScreen from './EditSongScreen';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { FontFamily, FontSize, Spacing, Button } from '@/constants/Theme';

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
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: Spacing.md,
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
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  artist: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  menuButton: {
    padding: Spacing.xs,
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  menuArtwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: Spacing.lg,
  },
  menuImage: {
    width: '100%',
    height: '100%',
  },
  menuTitleContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  menuArtist: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  menuItemText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    color: Colors.text,
    marginLeft: Spacing.lg,
  },
  deleteButton: {
    marginTop: Spacing.md,
  },
  deleteText: {
    color: Colors.tint,
  },
});

export default SongItem;