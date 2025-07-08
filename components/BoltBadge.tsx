// components/BoltBadge.tsx
import React, { useRef, useEffect } from "react";
import { View, Animated, Pressable, Image, StyleSheet, Linking, Platform } from "react-native";

const BADGE_URL = "https://bolt.new/?rid=os72mi";

export default function BoltBadge() {
  const introAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(introAnim, {
      toValue: 1,
      duration: 800,
      delay: 1000,
      useNativeDriver: true,
    }).start();

    // Add listeners to prevent warning
    const scaleListener = scaleAnim.addListener(() => {});
    const rotateListener = rotateAnim.addListener(() => {});

    return () => {
      scaleAnim.removeListener(scaleListener);
      rotateAnim.removeListener(rotateListener);
    };
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 22,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    Linking.openURL(BADGE_URL);
  };

  const rotateY = introAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"],
  });

  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 22],
    outputRange: ["0deg", "22deg"],
  });

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.link}
      >
        <Animated.Image
          source={require("@/assets/images/bolt-badge.png")}
          accessibilityLabel="Built with Bolt.new badge"
          style={[
            styles.badge,
            {
              transform: [
                { perspective: 1000 },
                { rotateY },
                { scale: scaleAnim },
                { rotateZ },
              ],
              opacity: introAnim,
            },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    right: 16,
    zIndex: 50,
    pointerEvents: "box-none",
  },
  link: {
    display: "flex",
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "red",
    borderColor: "lime",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    ...Platform.select({
      web: {
        transition: "all 0.3s ease",
      },
    }),
  },
});