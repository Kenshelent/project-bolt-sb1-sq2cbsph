import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Colors from '@/constants/Colors';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';

interface Lyric {
  startTime: number;
  text: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LINE_HEIGHT = 32 + 24;
const LYRICS_OFFSET = -930;

export default function LyricsView() {
  const { currentTrack, position } = usePlaybackStatus();
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  // реф для доступа к ScrollView
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!currentTrack) return;

    let isCancelled = false;
    
    const fetchLyrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          artist_name: currentTrack.artist,
          track_name: currentTrack.title,
        });

        const response = await fetch(`https://lrclib.net/api/get?${params}`);
        
        if (isCancelled) return;
        
        if (!response.ok) throw new Error('No lyrics found');

        const data = await response.json();
        
        if (isCancelled) return;
        
        let parsed: Lyric[] = [];

        if (data.syncedLyrics) {
          parsed = data.syncedLyrics
            .split('\n')
            .map(line => {
              const m = line.match(/^\[(\d+):(\d+\.\d+)\](.+)$/);
              if (!m) return null;
              const [, min, sec, text] = m;
              return {
                startTime: Math.round(+min * 60000 + +sec * 1000),
                text: text.trim(),
              };
            })
            .filter(Boolean) as Lyric[];
        } else if (data.plainLyrics) {
          parsed = data.plainLyrics
            .split('\n')
            .filter(l => l.trim())
            .map((text, i) => ({
              startTime: i * 1000,
              text: text.trim(),
            }));
        } else {
          throw new Error('No lyrics found');
        }

        if (!isCancelled) {
        setLyrics(parsed);
        }
      } catch (e) {
        if (!isCancelled) {
        setError((e as Error).message);
        setLyrics([]);
        }
      } finally {
        if (!isCancelled) {
        setLoading(false);
        }
      }
    };

    fetchLyrics();
    
    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  useEffect(() => {
    if (!lyrics.length) return;

    // вычисляем индекс текущей строки
    const idx = lyrics.findIndex((lyric, i) => {
      const next = lyrics[i + 1];
      const pos = position - LYRICS_OFFSET;
      return pos >= lyric.startTime && (!next || pos < next.startTime);
    });
    if (idx !== -1) setCurrentLineIndex(idx);
  }, [position, lyrics]);

  // автоскролл
  useEffect(() => {
    if (currentLineIndex >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        y: currentLineIndex * LINE_HEIGHT,
        animated: true,
      });
    }
  }, [currentLineIndex]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.text} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.lyricsContainer}>
        {lyrics.map((lyric, i) => {
          const isActive = i === currentLineIndex;
          const isNext = i === currentLineIndex + 1;
          const isPrev = i === currentLineIndex - 1;
          return (
            <Text
              key={i}
              style={[
                styles.lyricLine,
                isActive && styles.activeLine,
                isNext && styles.nextLine,
                isPrev && styles.previousLine,
                !isActive && !isNext && !isPrev && styles.farLine,
              ]}
            >
              {lyric.text}
            </Text>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  lyricsContainer: {
    paddingVertical: 20,
    minHeight: SCREEN_WIDTH,
  },
  lyricLine: {
    fontSize: 24,
    lineHeight: 32,
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 24,
    textAlign: 'left',
  },
  activeLine: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    lineHeight: 36,
    color: Colors.text,
  },
  nextLine: {
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 20,
  },
  previousLine: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  farLine: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
