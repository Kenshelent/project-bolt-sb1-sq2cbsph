// Путь: src/components/ArtworkBanner.tsx

import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import DefaultAlbumCover from '@/components/DefaultAlbumCover';
import Colors from '@/constants/Colors';

type ArtworkBannerProps = {
  artworkUrl: string | null | undefined;
};

// Оборачиваем в React.memo и проверяем изменение только по artworkUrl
export const ArtworkBanner: React.FC<ArtworkBannerProps> = React.memo(
  ({ artworkUrl }) => {
    const { width: screenWidth } = Dimensions.get('window');
    const BANNER_SIZE = screenWidth; // квадратный баннер

    return (
      <View style={{ width: BANNER_SIZE, height: BANNER_SIZE }}>
        {artworkUrl ? (
          <Image
            source={{ uri: artworkUrl }}
            style={{ width: BANNER_SIZE, height: BANNER_SIZE }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: BANNER_SIZE, height: BANNER_SIZE },
            ]}
          >
            <DefaultAlbumCover style={styles.placeholder} />
          </View>
        )}
      </View>
    );
  },
  (prevProps, nextProps) => prevProps.artworkUrl === nextProps.artworkUrl
);

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
