import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { MusicProvider } from '@/context/MusicContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <GestureHandlerRootView style={styles.container}>
      <MusicProvider>
        <PlaylistProvider>
          <Stack 
            screenOptions={{ 
              headerShown: false,
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen 
              name="player" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }} 
            />
            <Stack.Screen 
              name="edit"
              options={{ 
                animation: 'slide_from_right',
              }} 
            />
            <Stack.Screen 
              name="playlist/[id]" 
              options={{
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </PlaylistProvider>
      </MusicProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});