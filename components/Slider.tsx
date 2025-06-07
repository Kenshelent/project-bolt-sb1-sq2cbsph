import React, { useEffect } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useDerivedValue,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

interface SliderProps {
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

// Подбирайте duration под вашу частоту обновлений
const TIMING_CONFIG = {
  duration: 1000,
};

const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  onSlidingComplete,
}) => {
  const trackWidth = useSharedValue(0);
  const normalized = useSharedValue(value);
  const stripHeight = useSharedValue(12);
  const isSliding = useSharedValue(false);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      cancelAnimation(normalized);
      cancelAnimation(stripHeight);
    };
  }, []);

  // При изменении пропса value — плавно анимируем normalized от 0 до 1
  useDerivedValue(() => {
    if (!isSliding.value && trackWidth.value > 0) {
      normalized.value = withTiming(value, TIMING_CONFIG);
    }
  }, [value]);

  const calcNormalized = (x: number) => {
    'worklet';
    const w = trackWidth.value;
    return w > 0 ? Math.min(Math.max(x / w, 0), 1) : 0;
  };

  // При пане или тапе сразу обновляем normalized
  const updateProgress = (x: number) => {
    'worklet';
    const norm = calcNormalized(x);
    normalized.value = norm;
    if (onValueChange) {
      runOnJS(onValueChange)(norm);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      isSliding.value = true;
      stripHeight.value = withTiming(20, { duration: 150 });
    })
    .onUpdate((e) => {
      updateProgress(e.x);
    })
    .onEnd(() => {
      const final = normalized.value;
      isSliding.value = false;
      stripHeight.value = withTiming(12, { duration: 150 });
      if (onSlidingComplete) {
        runOnJS(onSlidingComplete)(final);
      }
    })
    .onFinalize(() => {
      isSliding.value = false;
      stripHeight.value = withTiming(12, { duration: 150 });
    });

  const tap = Gesture.Tap().onStart((e) => {
    updateProgress(e.x);
    if (onSlidingComplete) {
      const final = calcNormalized(e.x);
      runOnJS(onSlidingComplete)(final);
    }
  });

  const gesture = Gesture.Race(pan, tap);

  const trackBgStyle = useAnimatedStyle(() => ({
    height: stripHeight.value,
    borderRadius: stripHeight.value / 2,
    overflow: 'hidden',
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: normalized.value * trackWidth.value,
    height: stripHeight.value,
  }));

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={styles.container}
          onLayout={(e: LayoutChangeEvent) => {
            const { width } = e.nativeEvent.layout;
            if (width > 0) {
              trackWidth.value = width;
              // задаём стартовое положение без анимации
              normalized.value = value;
            }
          }}
        >
          <Animated.View style={[styles.trackBackground, trackBgStyle]}>
            <Animated.View style={[styles.track, progressStyle]} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
  },
  container: {
    height: 10,
    justifyContent: 'center',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  track: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default Slider;
