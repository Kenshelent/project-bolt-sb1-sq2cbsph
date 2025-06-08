import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Slider from '@/components/Slider';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { router } from 'expo-router';
import { formatTime } from '@/utils/timeFormat';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import LyricsView from '@/components/LyricsView';
import { FontFamily, FontSize, Spacing, Button } from '@/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = SCREEN_WIDTH - 48;
const PREVIEW_ARTWORK_SIZE = ARTWORK_SIZE * 0.7;
const PREVIEW_SPACING = 24;

export default function PlayerScreen() {
  const { 
    currentTrack, 
    isPlaying, 
    position, 
    duration, 
    playbackInstance,
    togglePlayPause,
    seekTo,
    playNextTrack,
    playPreviousTrack,
    isShuffleMode,
    toggleShuffleMode,
    isRepeatMode,
    toggleRepeatMode,
    tracks,
    currentTrackIndex,
  } = usePlaybackStatus();
  
  const [sliderValue, setSliderValue] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  
  const previousTrack = currentTrackIndex > 0 ? tracks[currentTrackIndex - 1] : null;
  const nextTrack = currentTrackIndex < tracks.length - 1 ? tracks[currentTrackIndex + 1] : null;

  useEffect(() => {
    if (duration > 0) {
      setSliderValue(position / duration);
    }
  }, [position, duration]);

  const handleSliderValueChange = (value: number) => {
    setSliderValue(value);
  };

  const handleSliderComplete = async (value: number) => {
    if (playbackInstance) {
      const newPosition = value * duration;
      await seekTo(newPosition);
    }
  };

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.noTrackText}>No track selected</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background}>
        {currentTrack.artwork ? (
          <Image
            source={{ uri: currentTrack.artwork }}
            style={styles.backgroundImage}
            blurRadius={25}
          />
        ) : (
          <View style={styles.backgroundFallback} />
        )}
        <BlurView intensity={80} style={styles.blur} tint="dark" />
      </View>
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.pullHandle} />
        
        <View style={styles.artworkContainer}>
          {!showLyrics ? (
            <>
              <View style={[styles.previewArtworkLeft, !previousTrack && styles.emptyPreview]}>
                {previousTrack && (
                  previousTrack.artwork ? (
                    <Image 
                      source={{ uri: previousTrack.artwork }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <DefaultAlbumCover style={styles.previewImage} />
                  )
                )}
              </View>

              <View style={styles.mainArtwork}>
                {currentTrack.artwork ? (
                  <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} />
                ) : (
                  <DefaultAlbumCover style={styles.artwork} />
                )}
              </View>

              <View style={[styles.previewArtworkRight, !nextTrack && styles.emptyPreview]}>
                {nextTrack && (
                  nextTrack.artwork ? (
                    <Image 
                      source={{ uri: nextTrack.artwork }} 
                      style={styles.previewImage} 
                    />
                  ) : (
                    <DefaultAlbumCover style={styles.previewImage} />
                  )
                )}
              </View>
            </>
          ) : (
            <View style={styles.lyricsContainer}>
              <LyricsView />
            </View>
          )}
        </View>

        <View style={styles.trackInfoContainer}>
          <View style={styles.trackTitleRow}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
          </View>
          <Text style={styles.artistName} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>
        
        <View style={styles.seekBarContainer}>
          <Slider
            value={sliderValue}
            onValueChange={handleSliderValueChange}
            onSlidingComplete={handleSliderComplete}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.shuffleButton} 
            onPress={toggleShuffleMode}
          >
            <Shuffle 
              size={22} 
              color={isShuffleMode ? Colors.tint : Colors.textSecondary} 
            />
          </TouchableOpacity>
          
          <View style={styles.mainControls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={playPreviousTrack}
            >
              <SkipBack size={36} color={Colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playPauseButton} 
              onPress={togglePlayPause}
            >
              {isPlaying ? (
                <Pause size={42} color={Colors.white} />
              ) : (
                <Play size={42} color={Colors.white} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={playNextTrack}
            >
              <SkipForward size={36} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.repeatButton} 
            onPress={toggleRepeatMode}
          >
            <Repeat 
              size={22} 
              color={isRepeatMode ? Colors.tint : Colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.lyricButton, showLyrics && styles.lyricButtonActive]} 
          onPress={() => setShowLyrics(!showLyrics)}
        >
          <Text style={[styles.lyricButtonText, showLyrics && styles.lyricButtonTextActive]}>
            LYRIC MODE
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  backgroundFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  pullHandle: {
    width: 40,
    opacity: 0.6,
    height: 6,
    backgroundColor: Colors.textSecondary,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 5,
  },
  artworkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    height: ARTWORK_SIZE,
    marginHorizontal: -PREVIEW_SPACING,
  },
  previewArtworkLeft: {
    width: PREVIEW_ARTWORK_SIZE,
    height: PREVIEW_ARTWORK_SIZE,
    opacity: 0.5,
    transform: [{ scale: 0.9 }, { translateX: PREVIEW_SPACING }],
  },
  previewArtworkRight: {
    width: PREVIEW_ARTWORK_SIZE,
    height: PREVIEW_ARTWORK_SIZE,
    opacity: 0.5,
    transform: [{ scale: 0.9 }, { translateX: -PREVIEW_SPACING }],
  },
  emptyPreview: {
    opacity: 0,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mainArtwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    marginHorizontal: PREVIEW_SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  artwork: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  lyricsContainer: {
    height: ARTWORK_SIZE,
    width: '100%',
  },
  trackInfoContainer: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  trackTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trackTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xl,
    color: Colors.text,
    flex: 1,
  },
  artistName: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
  },
  seekBarContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -6,
  },
  timeText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl + Spacing.lg,
  },
  shuffleButton: {
    padding: Spacing.md,
  },
  repeatButton: {
    padding: Spacing.md,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButton: {
    padding: Spacing.md,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
  },
  lyricButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: Spacing.xl,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 0 : Spacing.xl,
  },
  lyricButtonActive: {
    backgroundColor: Colors.tint,
  },
  lyricButtonText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.md,
    color: Colors.text,
    letterSpacing: 1,
  },
  lyricButtonTextActive: {
    color: Colors.white,
  },
  noTrackText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl + Spacing.lg,
  },
});
