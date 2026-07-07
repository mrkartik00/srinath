import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, TextInput, Alert, Platform, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/ui/GlassCard';
import PressableButton from '../components/ui/PressableButton';
import { getMyProfile, updateMyProfile } from '../api/patient';
import { haptics } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ dateOfBirth: '', gender: '', bloodGroup: '', address: { street: '', city: '', state: '', zipCode: '' }, emergencyContact: { name: '', phone: '', relation: '' }, allergies: '' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getMyProfile().then((res) => {
      const p = res.data;
      setForm({ dateOfBirth: p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split('T')[0] : '', gender: p.gender || '', bloodGroup: p.bloodGroup || '', address: p.address || { street: '', city: '', state: '', zipCode: '' }, emergencyContact: p.emergencyContact || { name: '', phone: '', relation: '' }, allergies: p.allergies?.join(', ') || '' });
    }).catch(() => {}).finally(() => { setLoading(false); Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); });
  }, []);

  const handleSave = async () => { haptics.medium(); setSaving(true); try { await updateMyProfile({ ...form, allergies: form.allergies ? form.allergies.split(',').map(a => a.trim()).filter(Boolean) : [] }); haptics.success(); Alert.alert('Success', 'Profile updated!'); } catch (err) { haptics.error(); Alert.alert('Error', Array.isArray(err) ? err.join('\n') : (typeof err === 'string' ? err : 'Update failed')); } finally { setSaving(false); } };

  if (loading) return <View style={[styles.center, { backgroundColor: theme.bg }]}><ActivityIndicator size="large" color={theme.primary} /></View>;

  const Field = ({ label, value, onChangeText, placeholder, ...props }) => (
    <>
      <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.textMuted} {...props} />
    </>
  );

  const Chip = ({ label, active, onPress }) => (
    <PressableButton onPress={onPress} hapticType="selection" style={[styles.chip, { backgroundColor: active ? theme.primary : theme.chipBg }]} scaleTo={0.94}>
      <Text style={[styles.chipText, { color: active ? '#fff' : theme.text }]}>{label}</Text>
    </PressableButton>
  );

  return (
    <LinearGradient colors={theme.gradient} style={[styles.flex, { backgroundColor: theme.bg }]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
          <Text style={{ fontSize: 15, color: theme.textMuted, marginTop: 2, marginBottom: 20 }}>Manage your medical and personal information</Text>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PERSONAL INFORMATION</Text>
          <GlassCard style={styles.cardSpacing}>
            <Field label="Date of Birth" value={form.dateOfBirth} onChangeText={(v) => setForm({ ...form, dateOfBirth: v })} placeholder="1990-01-15" />
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Gender</Text>
            <View style={styles.chipRow}>{['male', 'female', 'other'].map(g => <Chip key={g} label={g} active={form.gender === g} onPress={() => { haptics.selection(); setForm({ ...form, gender: g }); }} />)}</View>
            <Text style={[styles.fieldLabel, { color: theme.text }]}>Blood Group</Text>
            <View style={styles.chipRow}>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <Chip key={bg} label={bg} active={form.bloodGroup === bg} onPress={() => { haptics.selection(); setForm({ ...form, bloodGroup: bg }); }} />)}</View>
          </GlassCard>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>ADDRESS</Text>
          <GlassCard style={styles.cardSpacing}>
            <Field label="Street" value={form.address.street} onChangeText={(v) => setForm({ ...form, address: { ...form.address, street: v } })} placeholder="Street" />
            <Field label="City" value={form.address.city} onChangeText={(v) => setForm({ ...form, address: { ...form.address, city: v } })} placeholder="City" />
            <Field label="State" value={form.address.state} onChangeText={(v) => setForm({ ...form, address: { ...form.address, state: v } })} placeholder="State" />
            <Field label="Zip Code" value={form.address.zipCode} onChangeText={(v) => setForm({ ...form, address: { ...form.address, zipCode: v } })} placeholder="Zip" keyboardType="numeric" />
          </GlassCard>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>EMERGENCY CONTACT</Text>
          <GlassCard style={styles.cardSpacing}>
            <Field label="Name" value={form.emergencyContact.name} onChangeText={(v) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: v } })} placeholder="Contact name" />
            <Field label="Phone" value={form.emergencyContact.phone} onChangeText={(v) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: v } })} placeholder="Phone" keyboardType="phone-pad" />
            <Field label="Relation" value={form.emergencyContact.relation} onChangeText={(v) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, relation: v } })} placeholder="e.g. Spouse" />
          </GlassCard>

          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MEDICAL INFO</Text>
          <GlassCard style={styles.cardSpacing}>
            <Field label="Allergies (comma separated)" value={form.allergies} onChangeText={(v) => setForm({ ...form, allergies: v })} placeholder="e.g. penicillin, peanuts" multiline style={{ height: 60, textAlignVertical: 'top' }} />
          </GlassCard>

          <PressableButton onPress={handleSave} hapticType="medium" disabled={saving} style={{ marginTop: 24, borderRadius: 14 }} scaleTo={0.97}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.saveBtn}>
              <Ionicons name={saving ? 'hourglass' : 'checkmark-circle'} size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </LinearGradient>
          </PressableButton>
        </Animated.View>
        <View style={{ height: 120 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 20 },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.5 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 20, marginBottom: 10 },
  cardSpacing: { marginBottom: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  chipText: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});
