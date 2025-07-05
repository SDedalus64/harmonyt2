import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  getSemanticSuggestions,
  getMaterialSuggestions,
  fetchAllTariffSuggestions,
  LinkSuggestion,
} from '../services/semanticLinkService';

export default function TariffEngineeringScreen() {
  const [code, setCode] = useState('');
  const [semanticResults, setSemanticResults] = useState<LinkSuggestion[]>([]);
  const [materialResults, setMaterialResults] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setError('');
    setLoading(true);
    fetchAllTariffSuggestions(code)
      .then((all) => {
        // split back into two categories for display
        const codesSet = new Set(all.map((s) => s.code));
        setSemanticResults(getSemanticSuggestions(code).filter((s) => codesSet.has(s.code)));
        setMaterialResults(getMaterialSuggestions(code).filter((s) => codesSet.has(s.code)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
      <Button title="Find Alternatives" onPress={handleSearch} disabled={loading} />
      {loading && <ActivityIndicator style={styles.loadingIndicator} size="small" color="#0A99F2" />}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.section}>Semantic Similar Codes</Text>
      <FlatList
        data={semanticResults}
        keyExtractor={(item) => item.code}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.score}>{(item.score * 100).toFixed(1)}%</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>None</Text>}
      />

      <Text style={styles.section}>Material Alternatives</Text>

      <FlatList
        data={materialResults}
        keyExtractor={(item) => item.code}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.score}>{(item.score * 100).toFixed(1)}%</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>None</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  code: {
    fontSize: 16,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  empty: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 24,
  },
  error: {
    color: 'red',
    marginTop: 8,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: {
    marginTop: 8,
  },
  listItem: {
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  score: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
});