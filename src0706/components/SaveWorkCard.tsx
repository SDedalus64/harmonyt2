import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SaveWorkCardProps {
  onPress: () => void;
  isLoggedIn: boolean;
}

export default function SaveWorkCard({
  onPress,
  isLoggedIn,
}: SaveWorkCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Save Your Work</Text>

      <Text style={styles.description}>
        Get your results and our{" "}
        <Text style={styles.highlightText}>free tariff guide</Text> sent to your
        inbox
      </Text>

      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Email Results</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E67E22",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    backgroundColor: "#FFF9E6",
    borderColor: "#FFE0A0",
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 16,
    padding: 16,
  },
  description: {
    color: "#333",
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightText: {
    color: "#E67E22",
    fontWeight: "600",
  },
  title: {
    color: "#217DB2",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
});
