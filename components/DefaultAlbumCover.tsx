import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Music } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface DefaultAlbumCoverProps {
  style?: StyleProp<ViewStyle>;
}

const DefaultAlbumCover: React.FC<DefaultAlbumCoverProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Music size={24} color={Colors.text} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
});

export default DefaultAlbumCover;