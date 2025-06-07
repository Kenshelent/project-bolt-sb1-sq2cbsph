import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import TrackCard from './TrackCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
};

const NowPlayingBar = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlayPause, 
    position, 
    duration,
    tracks,
    currentTrackIndex,
    playTrack,
    stopTrack,
  } = usePlaybackStatus();
  
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(translateX);
    };
  }, []);

  useEffect(() => {
    translateX.value = 0;
  }, [currentTrackIndex]);

  if (!currentTrack) return null;

  const previousTrack = currentTrackIndex > 0 ? tracks[currentTrackIndex - 1] : null;
  const nextTrack = currentTrackIndex < tracks.length - 1 ? tracks[currentTrackIndex + 1] : null;

  const handleSwipeComplete = useCallback((direction: number) => {
    'worklet';
    const newIndex = currentTrackIndex - direction;
    if (newIndex >= 0 && newIndex < tracks.length) {
      runOnJS(playTrack)(tracks[newIndex], newIndex);
    }
  }, [currentTrackIndex, tracks, playTrack]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      const newX = event.translationX + context.value.x;
      if ((!previousTrack && newX > 0) || (!nextTrack && newX < 0)) {
        translateX.value = newX * 0.2;
      } else {
        translateX.value = newX;
      }
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const shouldSwipe = Math.abs(translateX.value) > CARD_WIDTH * 0.4 || 
                         Math.abs(velocity) > 500;
      
      if (shouldSwipe) {
        const direction = translateX.value > 0 ? 1 : -1;
        if (
          (direction > 0 && previousTrack) || 
          (direction < 0 && nextTrack)
        ) {
          translateX.value = withSpring(
            direction * CARD_WIDTH,
            SPRING_CONFIG, 
            () => {
              
              runOnJS(playTrack)(
                direction > 0 ? previousTrack : nextTrack,
                direction > 0 ? currentTrackIndex - 1 : currentTrackIndex + 1
              );
            }
          );
        } else {
          translateX.value = withSpring(0, SPRING_CONFIG)
        }
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const mainCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const previousCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - CARD_WIDTH }],
    opacity: withSpring(translateX.value > 0 ? 1 : 0),
  }));

  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + CARD_WIDTH }],
    opacity: withSpring(translateX.value < 0 ? 1 : 0),
  }));

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity 
      style={[styles.container, { bottom: 45 + insets.bottom }]} 
      onPress={() => router.push('/player')}
      activeOpacity={1}
    >
      <GestureDetector gesture={panGesture}>
        <View style={styles.cardsContainer}>
          {previousTrack && (
            <Animated.View style={[styles.playerWrapper, previousCardStyle]}>
              <View style={styles.playerContainer}>
                <TrackCard
                  track={previousTrack}
                  isPlaying={false}
                />
              </View>
            </Animated.View>
          )}
          
          <Animated.View style={[styles.playerWrapper, mainCardStyle]}>
            <View style={styles.playerContainer}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
              <TrackCard
                track={currentTrack}
                isPlaying={isPlaying}
                onPlayPause={togglePlayPause}
              />
            </View>
          </Animated.View>
          
          {nextTrack && (
            <Animated.View style={[styles.playerWrapper, nextCardStyle]}>
              <View style={styles.playerContainer}>
                <TrackCard
                  track={nextTrack}
                  isPlaying={false}
                />
              </View>
            </Animated.View>
          )}
        </View>
      </GestureDetector>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    position: 'absolute',
    left: 0,
    right: 0,
    height: 76,
    overflow: 'hidden',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  cardsContainer: {
    flex: 1,
    height: '100%',
  },
  playerWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playerContainer: {
    backgroundColor: '#2E2E2E',
    borderRadius: 11,
    overflow: 'hidden',
    position: 'relative',
    flex: 1,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#3F3F3F',
    zIndex: 1,
  },
});

export default NowPlayingBar;