import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function ArtistsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, 
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[name]" />
      <Stack.Screen name="album/[artist]/[name]" />
    </Stack>
  );
}