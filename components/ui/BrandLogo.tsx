import { StyleSheet, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
}

export function BrandLogo({ size = 36, showText = true, textSize = 24 }: BrandLogoProps) {
  const poundSize = size * 0.5;

  return (
    <View style={styles.container}>
      <View style={[styles.shieldWrap, { width: size, height: size }]}>
        <FontAwesome name="shield" size={size} color={Colors.grey[800]} />
        <Text
          style={[
            styles.pound,
            { fontSize: poundSize, lineHeight: size, width: size, height: size },
          ]}
        >
          {'\u00A3'}
        </Text>
      </View>
      {showText && (
        <Text style={[styles.wordmark, { fontSize: textSize }]}>QuidSafe</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pound: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: Fonts.manrope.bold,
    color: '#3B82F6',
    top: 0,
    left: 0,
  },
  wordmark: {
    fontFamily: Fonts.playfair.bold,
    color: Colors.white,
    letterSpacing: -0.5,
  },
});
