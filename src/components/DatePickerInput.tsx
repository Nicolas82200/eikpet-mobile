import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  value: string; // 'AAAA-MM-JJ' ou ''
  onChange: (value: string) => void;
  placeholder?: string;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplay(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

/** Selecteur de date natif : evite de faire taper "AAAA-MM-JJ" a la main. */
export default function DatePickerInput({ value, onChange, placeholder = 'Choisir une date' }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(toIsoDate(selectedDate));
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onPickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowPicker(false)}>
              <Text style={styles.doneButtonText}>Valider</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E3D8C4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#EFE2C4',
  },
  valueText: { color: '#000' },
  placeholderText: { color: '#A79A85' },
  doneButton: { backgroundColor: '#B8863B', borderRadius: 8, padding: 10, marginBottom: 12, marginTop: 4 },
  doneButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
});
