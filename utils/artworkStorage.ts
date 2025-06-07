import * as FileSystem from 'expo-file-system';
import { fromByteArray, toByteArray } from 'base64-js';

const ARTWORK_DIR = `${FileSystem.documentDirectory}artwork/`;

// Ensure artwork directory exists
async function ensureArtworkDir() {
  const dirInfo = await FileSystem.getInfoAsync(ARTWORK_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(ARTWORK_DIR);
  }
}

// Save artwork data to a file and return the URI
export async function saveArtworkToFile(data: Uint8Array, format: string): Promise<string> {
  await ensureArtworkDir();
  
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${format.split('/')[1]}`;
  const fileUri = ARTWORK_DIR + fileName;
  
  const base64Data = fromByteArray(data);
  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return fileUri;
}

// Save base64 artwork string to file
export async function saveBase64ArtworkToFile(base64Data: string): Promise<string> {
  await ensureArtworkDir();
  
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 data URI');
  
  const [, format, data] = matches;
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${format.split('/')[1]}`;
  const fileUri = ARTWORK_DIR + fileName;
  
  await FileSystem.writeAsStringAsync(fileUri, data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return fileUri;
}

// Delete artwork file
export async function deleteArtworkFile(fileUri: string | null): Promise<void> {
  if (!fileUri) return;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  } catch (error) {
    console.error('Error deleting artwork file:', error);
  }
}