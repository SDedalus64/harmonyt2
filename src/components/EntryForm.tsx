// File: components/EntryForm.tsx
import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import FieldWithInfo from "../components/FieldWithInfo";
import CountryLookup from "../components/CountryLookup";
N
export interface EntryProps {
  htsCode: string;
  onHtsChange: (val: string) => void;
  selectedCountry?: { code: string; name: string };
  onCountryChange: (c: { code: string; name: string }) => void;
  declaredValue: string;
  onDeclaredChange: (val: string) => void;
  freightCost: string;
  onFreightChange: (val: string) => void;
  unitCount: string;
  onUnitsChange: (val: string) => void;
  isUSMCAOrigin: boolean;
  onUSMCAChange: (val: boolean) => void;
  isLoading: boolean;
  onCalculate: () => void;
  onClear: () => void;
}

export default function EntryForm({
  htsCode, onHtsChange,
  selectedCountry, onCountryChange,
  declaredValue, onDeclaredChange,
  freightCost, onFreightChange,
  unitCount, onUnitsChange,
  isUSMCAOrigin, onUSMCAChange,
  isLoading, onCalculate, onClear
}: EntryProps) {
  return (
    <View style={styles.container}>
      <FieldWithInfo
        placeholder="Code (3-8 digits)"
        value={htsCode}
        fieldKey="code"
        onChangeText={onHtsChange}
        keyboardType="number-pad"
      />
      <CountryLookup
        selectedCountry={selectedCountry}
        onSelect={onCountryChange}
      />
      <FieldWithInfo
        placeholder="Declared Value (USD)"
        value={declaredValue}
        fieldKey="declared"
        onChangeText={onDeclaredChange}
        keyboardType="decimal-pad"
      />
      <FieldWithInfo
        placeholder="Other Costs"
        value={freightCost}
        fieldKey="freight"
        onChangeText={onFreightChange}
        keyboardType="decimal-pad"
      />
      <FieldWithInfo
        placeholder="Unit Count"
        value={unitCount}
        fieldKey="units"
        onChangeText={onUnitsChange}
        keyboardType="number-pad"
      />
      {/* USMCA toggle */}
      {selectedCountry && ["CA", "MX"].includes(selectedCountry.code) && (
        <View style={styles.toggleRow}>
          <Text>USMCA Origin</Text>
          <Switch
            value={isUSMCAOrigin}
            onValueChange={onUSMCAChange}
          />
        </View>
      )}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabled]}
          onPress={onCalculate}
          disabled={isLoading}
        >
          <Text>{isLoading ? '…' : 'Calculate'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clear} onPress={onClear}>
          <Text>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  button: { padding: 12, backgroundColor: '#007AFF', borderRadius: 6 },
  clear: { padding: 12, backgroundColor: '#FF3B30', borderRadius: 6 },
  disabled: { opacity: 0.6 }
});