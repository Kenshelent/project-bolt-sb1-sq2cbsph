import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Play, MoreHorizontal } from 'lucide-react-native';
import SongItem from '@/components/SongItem';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';

type AlbumBannerProps = {
  artworkUrl: string | null | undefined;
};

const AlbumBanner: React.FC<AlbumBannerProps> = React.memo(
  ({ artworkUrl }) => {
    const { width: screenWidth } = Dimensions.get('window');
    const BANNER_SIZE = screenWidth;

    return (
      <View style={{ width: BANNER_SIZE, height: BANNER_SIZE }}>
        {artworkUrl ? (
          <Image
            source={{ uri: artworkUrl }}
            style={{ width: BANNER_SIZE, height: BANNER_SIZE }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: BANNER_SIZE, height: BANNER_SIZE },
            ]}
          >
            <DefaultAlbumCover style={styles.placeholder} />
          </View>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => prevProps.artworkUrl === nextProps.artworkUrl
);

type AlbumHeaderProps = {
  artworkUrl: string | null | undefined;
  albumName: string;
  artistName: string;
  onPlay: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
};

const AlbumHeader: React.FC<AlbumHeaderProps> = React.memo(
  ({ artworkUrl, albumName, artistName, onPlay, onLayout }) => (
    <View onLayout={onLayout} style={styles.albumHeaderContainer}>
      <AlbumBanner artworkUrl={artworkUrl} />

      <View style={styles.infoRow}>
        <View style={styles.textBlock}>
          <Text style={styles.albumName}>{albumName}</Text>
          <Text style={styles.artistName}>{artistName}</Text>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Play size={20} color={Colors.white} />
          <Text style={styles.playButtonText}>Play</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
  (prevProps, nextProps) =>
    prevProps.artworkUrl === nextProps.artworkUrl &&
    prevProps.albumName === nextProps.albumName &&
    prevProps.artistName === nextProps.artistName
);

export default function AlbumScreen() {
  const { artist, name } = useLocalSearchParams();
  const { tracks, currentTrack, playTrack } = usePlaybackStatus();

  const insets = useSafeAreaInsets();
  const HEADER_HEIGHT = 60;

  const [albumHeaderHeight, setAlbumHeaderHeight] = useState(0);
  const [showAlbumNameInHeader, setShowAlbumNameInHeader] = useState(false);

  const albumTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          track.album === name &&
          track.artist
            .split(',')
            .map((a) => a.trim())
            .includes(artist)
      ),
    [tracks, name, artist]
  );

  const currentArtwork = albumTracks[0]?.artwork ?? null;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = e.nativeEvent.contentOffset.y;
      if (
        yOffset >=
        albumHeaderHeight - (insets.top + HEADER_HEIGHT)
      ) {
        if (!showAlbumNameInHeader) setShowAlbumNameInHeader(true);
      } else {
        if (showAlbumNameInHeader) setShowAlbumNameInHeader(false);
      }
    },
    [albumHeaderHeight, insets.top, showAlbumNameInHeader]
  );

  const onAlbumHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setAlbumHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  const handlePlayAlbum = useCallback(() => {
    if (albumTracks.length > 0) {
      const firstTrack = albumTracks[0];
      const globalIndex = tracks.findIndex((t) => t.id === firstTrack.id);
      playTrack(firstTrack, globalIndex);
    }
  }, [albumTracks, playTrack, tracks]);

  const renderTrackItem = useCallback(
    ({ item, index }) => (
      <View style={styles.trackWrapper}>
        <SongItem
          track={item}
          index={index}
          onPress={() => {
            const globalIndex = tracks.findIndex((t) => t.id === item.id);
            playTrack(item, globalIndex);
          }}
        />
      </View>
    ),
    [tracks, playTrack]
  );

  const albumHeaderComponent = useMemo(() => {
    return (
      <AlbumHeader
        artworkUrl={currentArtwork}
        albumName={name}
        artistName={artist}
        onPlay={handlePlayAlbum}
        onLayout={onAlbumHeaderLayout}
      />
    );
  }, [currentArtwork, name, artist, handlePlayAlbum, onAlbumHeaderLayout]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" style="light" />

      <View
        style={[
          styles.header,
          {
            height: insets.top + HEADER_HEIGHT,
            backgroundColor: showAlbumNameInHeader ? '#000' : 'transparent',
          },
        ]}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.blurCircle}
          >
            <BlurView
              intensity={50}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <ChevronLeft size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            {showAlbumNameInHeader && (
              <Text style={styles.headerTitle}>{name}</Text>
            )}
          </View>

          <TouchableOpacity style={styles.blurCircle}>
            <BlurView
              intensity={50}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <MoreHorizontal size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={albumTracks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={albumHeaderComponent}
        renderItem={renderTrackItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  blurCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  albumHeaderContainer: {
    // По высоте определяется динамически через onLayout
  },
  placeholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.background,
  },
  textBlock: {
    flex: 1,
  },
  albumName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 4,
  },
  artistName: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tint,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 16,
  },
  playButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
    marginLeft: 8,
  },
  trackWrapper: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
    backgroundColor: Colors.background,
  },
});