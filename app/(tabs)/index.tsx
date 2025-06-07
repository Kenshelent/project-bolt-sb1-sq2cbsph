import React, { useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { router } from 'expo-router';
import SongItem from '@/components/SongItem';
import { Plus } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import EmptyLibrary from '@/components/EmptyLibrary';
import { SafeAreaView } from 'react-native-safe-area-context';
import { importMusicFiles, showImportResult, ImportProgress } from '@/utils/musicImport';
import { useState } from 'react';

export default function LibraryScreen() {
  const { tracks, loadSavedTracks, playTrack, addTracks } = usePlaybackStatus();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  useEffect(() => {
    loadSavedTracks();
  }, []);

  const handleAddMusic = async () => {
    setIsImporting(true);
    setImportProgress(null);
    
    try {
      const result = await importMusicFiles(
        (progress) => setImportProgress(progress),
        addTracks
      );
      
      showImportResult(result);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  if (tracks.length === 0) {
    return <EmptyLibrary />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.headerContainer}>
          <Text style={styles.libraryCount}>{tracks.length} Songs</Text>
          <TouchableOpacity 
            style={[styles.addButton, isImporting && styles.addButtonDisabled]} 
            onPress={handleAddMusic}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Plus size={16} color={Colors.white} />
            )}
            <Text style={styles.addButtonText}>
              {isImporting ? 'Adding...' : 'Add Music'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {importProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Processing {importProgress.current} of {importProgress.total}
            </Text>
            {importProgress.fileName && (
              <Text style={styles.progressFileName} numberOfLines={1}>
                {importProgress.fileName}
              </Text>
            )}
          </View>
        )}
        
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <SongItem
              key={item.id}
              track={item}
              index={index}
              onPress={() => {
                playTrack(item, index);
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  libraryCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tint,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addButtonDisabled: {
    opacity: 0,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
    marginLeft: 4,
  },
  progressContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  progressFileName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingBottom: 100,
  },
});