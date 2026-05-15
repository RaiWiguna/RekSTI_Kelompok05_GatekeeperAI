import React from "react";
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#00A8E8" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "#112D4E",
    textAlign: "center",
  },
});
