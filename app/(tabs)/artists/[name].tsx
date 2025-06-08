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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/Colors';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Play,
} from 'lucide-react-native';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';
import { ArtworkBanner } from '@/components/ArtworkBanner';

const HEADER_HEIGHT = 60;

export default function ArtistScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { tracks, playTrack } = usePlaybackStatus();
  const insets = useSafeAreaInsets();

  const [showArtistNameInHeader, setShowArtistNameInHeader] = useState(false);
  const [artistHeaderHeight, setArtistHeaderHeight] = useState(0);

  // Фильтруем треки по имени артиста
  const artistTracks = useMemo(
    () =>
      tracks.filter((track) =>
        track.artist
          .split(',')
          .map((a) => a.trim())
          .includes(name)
      ),
    [tracks, name]
  );

  // Группируем треки по альбомам
  const albums = useMemo(() => {
    return artistTracks
      .reduce((acc, track) => {
        const existing = acc.find((a) => a.name === track.album);
        if (existing) {
          existing.tracks.push(track);
        } else {
          acc.push({
            name: track.album,
            artwork: track.artwork,
            tracks: [track],
          });
        }
        return acc;
      }, [] as { name: string; artwork: string | null; tracks: typeof tracks }[])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [artistTracks]);

  const currentArtwork = artistTracks[0]?.artwork ?? null;

  // Обрабатываем прокрутку, чтобы показать имя артиста в шапке
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const yOffset = e.nativeEvent.contentOffset.y;
      if (yOffset >= artistHeaderHeight - (insets.top + HEADER_HEIGHT)) {
        if (!showArtistNameInHeader) setShowArtistNameInHeader(true);
      } else {
        if (showArtistNameInHeader) setShowArtistNameInHeader(false);
      }
    },
    [artistHeaderHeight, insets.top, showArtistNameInHeader]
  );

  // Узнаём высоту блока с баннером (ArtworkBanner + infoRow)
  const onArtistHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setArtistHeaderHeight(e.nativeEvent.layout.height);
  }, []);

  // При нажатии Play – запускаем первый трек и переходим в плеер
  const handlePlayAll = useCallback(() => {
    if (artistTracks.length > 0) {
      const firstTrack = artistTracks[0];
      const globalIndex = tracks.findIndex((t) => t.id === firstTrack.id);
      playTrack(firstTrack, globalIndex);
    }
  }, [artistTracks, playTrack, tracks]);

  // Рендер каждого альбома
  const renderAlbumItem = useCallback(
    ({ item: album }: { item: typeof albums[0] }) => (
      <TouchableOpacity
        style={styles.albumContainer}
        onPress={() =>
          router.push({
            pathname: '/artists/album/[artist]/[name]',
            params: { artist: name, name: album.name },
          })
        }
      >
        {album.artwork ? (
          <Image source={{ uri: album.artwork }} style={styles.albumArtwork} />
        ) : (
          <DefaultAlbumCover style={styles.albumArtwork} />
        )}
        <View style={styles.albumInfo}>
          <Text style={styles.albumName}>{album.name}</Text>
          <Text style={styles.trackCount}>
            {album.tracks.length} {album.tracks.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <ChevronRight size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    ),
    [name]
  );

  return (
    <View style={styles.container}>
      {/* Для iOS делаем статус-бар прозрачным, чтобы контент шел под него */}
      <StatusBar translucent backgroundColor="transparent" style="light" />

      {/* Абсолютная шапка, приклеенная к краю экрана */}
      <View
        style={[
          styles.headerContainer,
          {
            top: 0,
            height: insets.top + HEADER_HEIGHT,
            backgroundColor: showArtistNameInHeader ? '#000' : 'transparent',
          },
        ]}
      >
        {/* Внутреннее содержимое шапки: учёт высоты статус-бара через paddingTop */}
        <View
          style={[
            styles.headerContent,
            { paddingTop: insets.top, height: HEADER_HEIGHT },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.blurCircle}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <ChevronLeft size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.centerContainer}>
            {showArtistNameInHeader && <Text style={styles.headerTitle}>{name}</Text>}
          </View>

          <TouchableOpacity style={styles.blurCircle}>
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            <MoreHorizontal size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FlatList с контентом, который начинается под статус-баром */}
      <FlatList
        data={albums}
        keyExtractor={(item) => item.name}
        ListHeaderComponent={
          <View onLayout={onArtistHeaderLayout}>
            {/* Баннер с обложкой — теперь стартует с y=0, под notch */}
            <ArtworkBanner artworkUrl={currentArtwork} />

            <View style={styles.infoRow}>
              <View style={styles.textBlock}>
                <Text style={styles.artistNameBelow}>{name}</Text>
                <Text style={styles.albumCount}>
                  {albums.length} {albums.length === 1 ? 'album' : 'albums'}
                </Text>
              </View>
              <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
                <Play size={20} color={Colors.white} />
                <Text style={styles.playButtonText}>Play</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={renderAlbumItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        // Отключаем автоматическую корректировку контента на iOS
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
  headerContainer: {
    position: 'absolute',
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
    height: HEADER_HEIGHT,
  },
  blurCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text,
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
  artistNameBelow: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 4,
  },
  albumCount: {
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
  },
  playButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 100,
    backgroundColor: Colors.background,
  },
  albumContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  albumArtwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 16,
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  trackCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
