import { LANGUAGES, LIMITS, type Gender } from '@wmc/shared';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/theme';

import { ImagePickerField } from './ImagePickerField';
import { Chip, Input, Text } from './ui';

export interface ProfileFormValues {
  photoUri: string | null;
  firstName: string;
  age: string;
  bio: string;
  languages: string[];
  profession: string;
  gender: Gender | null;
}

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function validateProfile(v: ProfileFormValues): string | null {
  if (v.firstName.trim().length < 2) return 'Please enter your first name';
  const age = Number(v.age);
  if (!Number.isInteger(age) || age < LIMITS.minAge || age > LIMITS.maxAge) return `Age must be between ${LIMITS.minAge} and ${LIMITS.maxAge}`;
  if (v.bio.length > LIMITS.bioMaxLength) return `Bio must be ${LIMITS.bioMaxLength} characters or less`;
  if (v.languages.length === 0) return 'Pick at least one language';
  return null;
}

export function ProfileForm({ values, onChange }: { values: ProfileFormValues; onChange: (next: ProfileFormValues) => void }) {
  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => onChange({ ...values, [key]: value });
  const toggleLanguage = (code: string) =>
    set('languages', values.languages.includes(code) ? values.languages.filter((l) => l !== code) : [...values.languages, code]);

  return (
    <View style={styles.form}>
      <ImagePickerField shape="avatar" uri={values.photoUri} onChange={(uri) => set('photoUri', uri)} label="Add a photo" />
      <Input label="First name" placeholder="Ahmed" value={values.firstName} onChangeText={(t) => set('firstName', t)} autoCapitalize="words" />
      <Input label="Age" placeholder="27" value={values.age} onChangeText={(t) => set('age', t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} />
      <Input
        label="Bio"
        placeholder="A few words about you…"
        value={values.bio}
        onChangeText={(t) => set('bio', t.slice(0, LIMITS.bioMaxLength))}
        multiline
        hint={`${values.bio.length} / ${LIMITS.bioMaxLength}`}
      />
      <View>
        <Text variant="label" tone="secondary" style={styles.label}>
          Languages
        </Text>
        <View style={styles.chips}>
          {LANGUAGES.map((l) => (
            <Chip key={l.code} label={l.name} selected={values.languages.includes(l.code)} onPress={() => toggleLanguage(l.code)} size="sm" />
          ))}
        </View>
      </View>
      <Input label="Profession (optional)" placeholder="Software engineer" value={values.profession} onChangeText={(t) => set('profession', t.slice(0, 60))} />
      <View>
        <Text variant="label" tone="secondary" style={styles.label}>
          Gender (optional)
        </Text>
        <View style={styles.chips}>
          {GENDERS.map((g) => (
            <Chip key={g.value} label={g.label} selected={values.gender === g.value} onPress={() => set('gender', values.gender === g.value ? null : g.value)} size="sm" />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  label: { marginLeft: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
