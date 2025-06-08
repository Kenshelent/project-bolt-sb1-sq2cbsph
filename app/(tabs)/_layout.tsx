import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Colors from '@/constants/Colors';
import { Library, ListMusic, Mic as Mic2 } from 'lucide-react-native';
import NowPlayingBar from '@/components/NowPlayingBar';
import { usePlaybackStatus } from '@/hooks/usePlaybackStatus';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { currentTrack } = usePlaybackStatus();
  
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors.tint,
            tabBarStyle: styles.tabBar,
            headerStyle: styles.header,
            headerTitleStyle: styles.headerTitle,
            tabBarLabelStyle: styles.tabBarLabel,
            headerShown: false,
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Library',
              tabBarIcon: ({ color, size }) => <Library size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="playlists"
            options={{
              title: 'Playlists',
              tabBarIcon: ({ color, size }) => <ListMusic size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="artists"
            options={{
              title: 'Artists',
              tabBarIcon: ({ color, size }) => <Mic2 size={size} color={color} />,
            }}
          />
        </Tabs>
        
        {currentTrack && <NowPlayingBar />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#121212',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    height: 80,
    paddingBottom: 24,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
  },
  header: {
    backgroundColor: Colors.background,
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.text,
  },
});