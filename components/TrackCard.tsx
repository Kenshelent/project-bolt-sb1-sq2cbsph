import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import DefaultAlbumCover from './DefaultAlbumCover';
import { Track } from '@/context/MusicContext';
import Animated from 'react-native-reanimated';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  style?: any;
}

const TrackCard: React.FC<TrackCardProps> = ({ 
  track,  
  isPlaying, 
  onPlayPause,
  style 
}) => {
  return (
    <Animated.View style={[styles.container, style]}>
      <View style={styles.trackInfo}>
        {track.artwork ? (
          <Image source={{ uri: track.artwork }} style={styles.artwork} />
        ) : (
          <DefaultAlbumCover style={styles.artwork} />
        )}
        
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {track.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {track.artist}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.playButton}
        onPress={onPlayPause}
      >
        {isPlaying ? (
          <Pause size={24} color={Colors.text} />
        ) : (
          <Play size={24} color={Colors.text} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    zIndex: 2,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.text,
    marginBottom: 2,
  },
  artist: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TrackCard;