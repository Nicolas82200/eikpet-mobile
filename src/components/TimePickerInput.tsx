import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  value: string; // 'HH:MM' ou ''
  onChange: (value: string) => void;
  placeholder?: string;
}

function toHHMM(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** Selecteur d'heure natif (ex: heure d'un rendez-vous, heure de prise d'un traitement). */
export default function TimePickerInput({ value, onChange, placeholder = 'Choisir une heure' }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const timeValue = (() => {
    const date = new Date();
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    return date;
  })();

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(toHHMM(selectedDate));
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker value={timeValue} mode="time" display="default" onChange={onPickerChange} is24Hour />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  valueText: { color: '#000' },
  placeholderText: { color: '#999' },
});
