import { StatusBar } from "expo-status-bar";
import { SafeAreaView, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView>
      <StatusBar style="auto" />
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Gatekeeper AI</Text>
        <Text>Lecturer mobile app placeholder.</Text>
      </View>
    </SafeAreaView>
  );
}

