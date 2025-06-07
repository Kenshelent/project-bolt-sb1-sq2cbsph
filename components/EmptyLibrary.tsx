import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Music, Plus } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { importMusicFiles, showImportResult } from '@/utils/musicImport';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { useState } from 'react';

const EmptyLibrary = () => {
  const { addTracks } = usePlaybackStatus();
  const [isImporting, setIsImporting] = useState(false);

  const handleAddMusic = async () => {
    setIsImporting(true);
    
    try {
      const result = await importMusicFiles(undefined, addTracks);
      showImportResult(result);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Music size={64} color={Colors.tint} />
      </View>
      <Text style={styles.title}>Your Library is Empty</Text>
      <Text style={styles.message}>
        Add your favorite music to start building your personal collection.
      </Text>
      
      <TouchableOpacity
        style={[styles.addButton, isImporting && styles.addButtonDisabled]}
        onPress={handleAddMusic}
        disabled={isImporting}
      >
        {isImporting ? (
          <ActivityIndicator size="small\" color={Colors.white} />
        ) : (
          <Plus size={20} color={Colors.white} />
        )}
        <Text style={styles.addButtonText}>
          {isImporting ? 'Adding Music...' : 'Add Music'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 22,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: Colors.tint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  addButtonDisabled: {
    opacity: 0,
  },
  addButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
    marginLeft: 8,
  },
});

export default EmptyLibrary;