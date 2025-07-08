// File: components/ResultSummary.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface SummaryProps {
  duties: number;
  landed?: number;
  perUnitDuty?: number;
  perUnitLanded?: number;
}

export default function ResultSummary({ duties, landed, perUnitDuty, perUnitLanded }: SummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Est. Duties</Text>
      <Text style={styles.value}>${duties.toFixed(2)}</Text>
      {landed !== undefined && (
        <>
          <Text style={styles.title}>Est. Landed Cost</Text>
          <Text style={styles.value}>${landed.toFixed(2)}</Text>
        </>
      )}
      {perUnitDuty !== undefined && (
        <>  
          <Text style={styles.title}>Per Unit Duty</Text>
          <Text style={styles.value}>${perUnitDuty.toFixed(2)}</Text>
          {perUnitLanded !== undefined && (
            <>
              <Text style={styles.title}>Per Unit Landed</Text>
              <Text style={styles.value}>${perUnitLanded.toFixed(2)}</Text>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 },
  title: { fontWeight: '600', marginTop: 8 },
  value: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 }
});