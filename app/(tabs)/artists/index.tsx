import React, { useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus'; 
import { router } from 'expo-router';
import DefaultAlbumCover from '@/components/DefaultAlbumCover'; 
import { ChevronRight } from 'lucide-react-native';

interface Artist {
  name: string;
  artwork: string | null;
  albums: {
    name: string;
    artwork: string | null;
    tracks: any[];
  }[];
}

export default function ArtistsScreen() {
  const { tracks, currentTrack } = usePlaybackStatus();

  const artists = useMemo(() => {
    const artistMap = new Map<string, Artist>();

    tracks.forEach(track => {
      const artists = track.artist.split(',').map(a => a.trim());
      
      artists.forEach(artistName => {
        if (!artistMap.has(artistName)) {
          artistMap.set(artistName, {
            name: artistName,
            artwork: track.artwork,
            albums: [],
          });
        }

        const artist = artistMap.get(artistName)!;
        const albumIndex = artist.albums.findIndex(a => a.name === track.album);

        if (albumIndex === -1) {
          artist.albums.push({
            name: track.album,
            artwork: track.artwork,
            tracks: [track],
          });
        } else {
          artist.albums[albumIndex].tracks.push(track);
        }
      });
    });

    return Array.from(artistMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  const renderArtistItem = ({ item: artist }: { item: Artist }) => (
    <TouchableOpacity
      style={styles.artistRow}
      onPress={() => router.push({
        pathname: '/artists/[name]',
        params: { name: artist.name }
      })}
    >
      <View style={styles.artistInfo}>
        {artist.artwork ? (
          <Image source={{ uri: artist.artwork }} style={styles.artistImage} />
        ) : (
          <DefaultAlbumCover style={styles.artistImage} />
        )}
        <View style={styles.artistNameContainer}>
          <Text style={styles.artistName}>{artist.name}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Artists</Text>
        
        <FlatList
          data={artists}
          renderItem={renderArtistItem}
          keyExtractor={item => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
      </View>
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
  },
  list: {
    paddingBottom: 100,
  },
  artistRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  artistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  artistImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  artistNameContainer: {
    flex: 1,
  },
  artistName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
});