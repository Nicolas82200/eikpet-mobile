import React from 'react';
import ChipPicker from './ChipPicker';

const SPECIES_OPTIONS = ['Chien', 'Chat', 'Cheval'] as const;

interface Props {
  value: string;
  onChange: (species: string) => void;
}

export default function SpeciesPicker({ value, onChange }: Props) {
  return (
    <ChipPicker
      value={value}
      onChange={onChange}
      options={SPECIES_OPTIONS}
      customPlaceholder="Preciser l'espece (NAC, etc.)"
    />
  );
}
