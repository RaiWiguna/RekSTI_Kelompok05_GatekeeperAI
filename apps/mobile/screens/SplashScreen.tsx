import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";

export function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current; // Mulai dari ukuran setengah

  useEffect(() => {
    // Jalankan urutan animasi
    Animated.sequence([
      // FASE 1: Muncul (Fade In) dan membesar perlahan ke ukuran normal (1)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      
      // FASE 2: Animasi Maju Mundur (Looping membesar lalu mengecil)
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15, // Membesar (Maju)
            duration: 1000, // Durasi 1 detik per gerakan agar smooth
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1, // Mengecil (Mundur)
            duration: 1000, // Durasi 1 detik per gerakan
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim, 
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Animated.Image
          source={require('../assets/gatekeeper.png')} 
          style={styles.logo}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 300, // Ukuran diperbesar secara signifikan dari 220
    height: 300,
    resizeMode: "contain",
  },
});