import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseBuffer } from 'music-metadata-browser';
import { toByteArray } from 'base64-js';
import { saveArtworkToFile } from '@/utils/artworkStorage';
import { Track } from '@/context/MusicContext';
import { Alert } from 'react-native';

// Ensure Buffer is available globally
import { Buffer } from 'buffer';
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export interface ImportProgress {
  current: number;
  total: number;
  fileName?: string;
}

export interface ImportResult {
  success: boolean;
  tracksAdded: number;
  errors: string[];
}

const fetchPartialBuffer = async (uri: string, mimeType: string, bytesToFetch = 300000) => {
  try {
    const response = await fetch(uri, {
      headers: {
        Range: `bytes=0-${bytesToFetch}`,
      },
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

export const importMusicFiles = async (
  onProgress?: (progress: ImportProgress) => void,
  addTracksCallback?: (tracks: Track[]) => Promise<void>
): Promise<ImportResult> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (
      result.type === 'cancel' ||
      result.canceled === true ||
      !result.assets ||
      result.assets.length === 0
    ) {
      return { success: false, tracksAdded: 0, errors: ['No files selected'] };
    }

    const files = result.assets;
    const total = files.length;
    const newTracks: Track[] = [];
    const errors: string[] = [];

    // Ensure music directory exists
    const musicDir = FileSystem.documentDirectory + 'music/';
    const dirInfo = await FileSystem.getInfoAsync(musicDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(musicDir);
    }

    for (let index = 0; index < total; index++) {
      const file = files[index];
      const fileName = file.name || `track_${index}`;
      
      onProgress?.({
        current: index + 1,
        total,
        fileName,
      });

      try {
        const id = Date.now().toString() + '_' + index;

        // ORIGINAL LOGIC: Try to get metadata from partial buffer first
        let metadata = null;
        const partialBuffer = await fetchPartialBuffer(file.uri, file.mimeType, 300000);
        
        if (partialBuffer) {
          try {
            metadata = await parseBuffer(partialBuffer, { mimeType: file.mimeType });
          } catch (error) {
            // Ignore error, will try full file next
          }
        }

        // ORIGINAL LOGIC: If partial buffer failed, try full file
        if (!metadata) {
          const b64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const uint8 = toByteArray(b64);
          const bufferFull = Buffer.from(uint8);
          metadata = await parseBuffer(bufferFull, { mimeType: file.mimeType });
        }

        const common = metadata?.common || {};
        const format = metadata?.format || {};
        
        // ORIGINAL LOGIC: Extract artwork if available
        let artwork = null;
        if (common.picture && common.picture.length > 0) {
          const picData = common.picture[0].data;
          const picFormat = common.picture[0].format;
          artwork = await saveArtworkToFile(picData, picFormat);
        }

        // ORIGINAL LOGIC: Copy file to music directory
        const ext = fileName.split('.').pop() || 'mp3';
        const newFilename = `${id}.${ext}`;
        const newUri = musicDir + newFilename;
        
        await FileSystem.copyAsync({
          from: file.uri,
          to: newUri,
        });

        // ORIGINAL LOGIC: Create track object with exact same structure
        const track: Track = {
          id,
          title: common.title || fileName.replace(/\.[^/.]+$/, ''),
          artist: common.artist || 'Unknown Artist',
          album: common.album || 'Unknown Album',
          year: common.year || null,
          duration: Math.round((format.duration || 0) * 1000),
          artwork,
          uri: newUri,
        };

        newTracks.push(track);
      } catch (error) {
        console.error(`Error processing file ${fileName}:`, error);
        errors.push(`Failed to process ${fileName}`);
      }
    }

    // Add tracks to library using the callback which calls MusicContext.addTracks
    // This ensures metadata is saved properly through the original saveMetadata function
    if (newTracks.length > 0 && addTracksCallback) {
      await addTracksCallback(newTracks);
    }

    return {
      success: newTracks.length > 0,
      tracksAdded: newTracks.length,
      errors,
    };
  } catch (error) {
    console.error('Error importing music files:', error);
    return {
      success: false,
      tracksAdded: 0,
      errors: ['Failed to import files'],
    };
  }
};

export const showImportResult = (result: ImportResult) => {
  if (result.success) {
    Alert.alert(
      'Import Complete',
      `Successfully added ${result.tracksAdded} track${result.tracksAdded === 1 ? '' : 's'} to your library.${
        result.errors.length > 0 ? `\n\n${result.errors.length} file(s) failed to import.` : ''
      }`
    );
  } else {
    Alert.alert(
      'Import Failed',
      result.errors.length > 0 ? result.errors.join('\n') : 'No tracks were imported.'
    );
  }
};