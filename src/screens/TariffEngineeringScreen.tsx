import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
} from 'react-native';
import { getTariffSuggestions, LinkSuggestion } from '../services/semanticLinkService';

export default function TariffEngineeringScreen() {
  const [code, setCode] = useState('');
  const [results, setResults] = useState<LinkSuggestion[]>([]);

  const handleSearch = () => {
    const sugg = getTariffSuggestions(code);
    setResults(sugg);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tariff Engineering Suggestions</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 8-digit HTS Code"
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={10}
      />
      <Button title="Find Alternatives" onPress={handleSearch} />

      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.score}>{(item.score * 100).toFixed(1)}%</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No suggestions yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  list: {
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  code: {
    fontSize: 16,
  },
  score: {
    fontSize: 16,
    color: '#666',
  },
  empty: {
    marginTop: 24,
    fontStyle: 'italic',
    color: '#888',
  },
});