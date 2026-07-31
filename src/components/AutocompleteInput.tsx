import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
}

/** Champ texte avec suggestions filtrees en dessous, plutot que d'afficher toutes les options d'un coup. */
export default function AutocompleteInput({ value, onChange, options, placeholder }: Props) {
  const [focused, setFocused] = useState(false);

  const query = value.trim().toLowerCase();
  const suggestions = focused
    ? options.filter((option) => option.toLowerCase().includes(query)).slice(0, 6)
    : [];
  const showSuggestions = suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0].toLowerCase() === query);

  return (
    <View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {showSuggestions && (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion}
              style={styles.suggestionItem}
              onPress={() => {
                onChange(suggestion);
                setFocused(false);
              }}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: 'white' },
  suggestions: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  suggestionText: { color: '#333' },
});
