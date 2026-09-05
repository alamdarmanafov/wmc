import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { Card, Input, Loading, Text, useToast } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import type { CityRow } from '@/lib/database.types';
import { nearestCity } from '@/lib/geo';
import { useCities, useUpdateLocation, useUpdateProfile } from '@/lib/queries';
import { errorMessage } from '@/lib/supabase';
import { theme } from '@/theme';

export default function LocationStep() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useAuth();
  const cities = useCities();
  const updateProfile = useUpdateProfile();
  const updateLocation = useUpdateLocation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(profile?.city_id ?? null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = cities.data ?? [];
    return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
  }, [cities.data, search]);

  const useMyLocation = async () => {
    if (!cities.data?.length) return;
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        toast.show('Location permission denied — pick your city below.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      await updateLocation.mutateAsync({ lat: latitude, lng: longitude });

      // Prefer the geocoded city name when it matches one of ours; else nearest by distance.
      let match: CityRow | null = null;
      try {
        const [addr] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const name = addr?.city?.toLowerCase();
        if (name) match = cities.data.find((c) => c.name.toLowerCase() === name) ?? null;
      } catch {
        // reverse geocoding is best-effort
      }
      match ??= nearestCity(cities.data, latitude, longitude);
      if (match) {
        setSelected(match.id);
        toast.success(`You're in ${match.name}`);
      }
    } catch (e) {
      toast.error(errorMessage(e, 'Could not get your location'));
    } finally {
      setLocating(false);
    }
  };

  const next = async () => {
    if (!selected) return;
    try {
      await updateProfile.mutateAsync({ city_id: selected });
      router.push('/(onboarding)/profile');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <OnboardingStep
      step={1}
      title="Choose your location"
      subtitle="We'll show you people, communities and activities nearby."
      onNext={next}
      nextDisabled={!selected}
      loading={updateProfile.isPending}
      canGoBack={false}>
      <Card tone="accent" onPress={locating ? undefined : useMyLocation}>
        <View style={styles.row}>
          <Text style={styles.emoji}>📍</Text>
          <View style={styles.flex}>
            <Text variant="bodyStrong">Use my location</Text>
            <Text variant="small" tone="secondary">
              Your exact location is never shown to others.
            </Text>
          </View>
          {locating ? <Loading /> : <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />}
        </View>
      </Card>

      <Text variant="label" tone="secondary" style={styles.or}>
        🔎 Or pick your city
      </Text>
      <Input placeholder="Search city" value={search} onChangeText={setSearch} autoCorrect={false} />

      <View style={styles.list}>
        {cities.isLoading ? <Loading /> : null}
        {filtered.map((city) => {
          const active = city.id === selected;
          return (
            <Pressable key={city.id} onPress={() => setSelected(city.id)} style={[styles.city, active && styles.cityActive]}>
              <Text variant={active ? 'bodyStrong' : 'body'} style={active ? { color: theme.colors.white } : undefined}>
                {city.name}
              </Text>
              {active ? <Ionicons name="checkmark" size={20} color={theme.colors.white} /> : null}
            </Pressable>
          );
        })}
        {!cities.isLoading && filtered.length === 0 ? (
          <Text tone="muted" style={styles.empty}>
            No city found. We&apos;re launching in more cities soon.
          </Text>
        ) : null}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 26 },
  flex: { flex: 1, gap: 2 },
  or: { marginTop: 24, marginBottom: 10 },
  list: { marginTop: 12, gap: 8 },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cityActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  empty: { textAlign: 'center', paddingVertical: 16 },
});
