import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/theme';

const splashIcon = require('../assets/splash-icon.png');

export default function Splash({ onHide }: { onHide?: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        onHide?.();
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, [opacity, onHide]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Image
        source={splashIcon}
        style={styles.image}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
