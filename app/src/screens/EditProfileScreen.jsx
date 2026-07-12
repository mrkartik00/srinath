import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  PressableButton,
  Avatar,
  Chip,
  BottomSheet,
} from '../components/ui';
import { useScreenAnimation } from '../hooks/useAnimations';
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
  removeAvatar,
} from '../api/profile';
import haptics from '../utils/haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

const GENDER_OPTIONS = ['male', 'female', 'other'];
const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function EditProfileScreen({ navigation }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { fadeAnim, slideAnim } = useScreenAnimation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getMyProfile();
      const profile = res.data || res;
      // getMyProfile populates `userId` with the account's name/email/phone/avatar
      // rather than flattening them onto the patient record itself.
      const account = profile.userId || {};
      setName(account.name || user?.name || '');
      setEmail(account.email || user?.email || '');
      setDob(profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '');
      setGender(profile.gender || '');
      setBloodGroup(profile.bloodGroup || '');
      setAllergies(profile.allergies?.join(', ') || '');
      setAvatarUrl(account.avatar || '');
      if (profile.address) {
        setStreet(profile.address.street || '');
        setCity(profile.address.city || '');
        setState(profile.address.state || '');
        setZip(profile.address.zipCode || '');
      }
      if (profile.emergencyContact) {
        setEmergencyName(profile.emergencyContact.name || '');
        setEmergencyPhone(profile.emergencyContact.phone || '');
        setEmergencyRelation(profile.emergencyContact.relation || '');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    haptics.medium();
    setSaving(true);
    try {
      await updateMyProfile({
        dateOfBirth: dob || undefined,
        // gender/bloodGroup are strict enums on the server — omit them
        // entirely rather than send '' when nothing's been picked yet,
        // which Mongoose rejects as an invalid enum value.
        ...(gender ? { gender } : {}),
        ...(bloodGroup ? { bloodGroup } : {}),
        allergies: allergies ? allergies.split(',').map((a) => a.trim()).filter(Boolean) : [],
        address: { street, city, state, zipCode: zip },
        emergencyContact: { name: emergencyName, phone: emergencyPhone, relation: emergencyRelation },
      });
      haptics.success();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      haptics.error();
      // The axios interceptor unwraps failed requests into a plain string or
      // an array of validation errors (see api/axios.js), not an Error
      // object — err.message is always undefined for those, which is why
      // this was always showing the generic fallback instead of the real
      // validation reason.
      const msg =
        (Array.isArray(err) && err.join('\n')) ||
        (typeof err === 'string' && err) ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update profile';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPress = () => {
    haptics.light();
    setAvatarSheetVisible(true);
  };

  const handleTakePhoto = async () => {
    setAvatarSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      await doUploadAvatar(result.assets[0].uri);
    }
  };

  const handleChooseGallery = async () => {
    setAvatarSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Gallery permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      await doUploadAvatar(result.assets[0].uri);
    }
  };

  const doUploadAvatar = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' });
      const res = await uploadAvatar(formData);
      setAvatarUrl(res.data?.avatar || uri);
      haptics.success();
    } catch (err) {
      haptics.error();
      Alert.alert('Error', 'Failed to upload avatar');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarSheetVisible(false);
    try {
      await removeAvatar();
      setAvatarUrl('');
      haptics.success();
    } catch (err) {
      haptics.error();
      Alert.alert('Error', 'Failed to remove avatar');
    }
  };

  const handleGenderSelect = (value) => {
    haptics.selection();
    setGender(value);
  };

  const handleBloodGroupSelect = (value) => {
    haptics.selection();
    setBloodGroup(value);
  };

  if (loading) {
    return (
      <LinearGradient colors={[theme.gradient[0], theme.gradient[2]]} style={styles.container}>
        <ScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[theme.gradient[0], theme.gradient[2]]} style={styles.container}>
      <ScreenHeader title="Edit Profile" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <PressableButton onPress={handleAvatarPress} style={styles.avatarWrapper}>
            <Avatar uri={avatarUrl} size={72} name={name} />
            <View style={[styles.avatarBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </PressableButton>
          <Text style={[styles.avatarHint, { color: theme.textSecondary }]}>Tap to change photo</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput style={[styles.input, styles.readOnly, { color: theme.text, borderColor: theme.border }]} value={name} editable={false} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <TextInput style={[styles.input, styles.readOnly, { color: theme.text, borderColor: theme.border }]} value={email} editable={false} keyboardType="email-address" />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Date of Birth</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt.charAt(0).toUpperCase() + opt.slice(1)} active={gender === opt} onPress={() => handleGenderSelect(opt)} />
            ))}
          </View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Blood Group</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUP_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={bloodGroup === opt} onPress={() => handleBloodGroupSelect(opt)} />
            ))}
          </View>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Allergies</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={allergies} onChangeText={setAllergies} placeholder="Comma-separated (e.g. Penicillin, Peanuts)" placeholderTextColor={theme.textMuted} multiline />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Address</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Street</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={street} onChangeText={setStreet} placeholder="Street address" placeholderTextColor={theme.textMuted} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>City</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={theme.textMuted} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>State</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={state} onChangeText={setState} placeholder="State" placeholderTextColor={theme.textMuted} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Zip</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={zip} onChangeText={setZip} placeholder="Zip code" placeholderTextColor={theme.textMuted} keyboardType="numeric" />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contact</Text>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={emergencyName} onChangeText={setEmergencyName} placeholder="Contact name" placeholderTextColor={theme.textMuted} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Phone</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Phone number" placeholderTextColor={theme.textMuted} keyboardType="phone-pad" />
          <Text style={[styles.label, { color: theme.textSecondary }]}>Relation</Text>
          <TextInput style={[styles.input, { color: theme.text, borderColor: theme.border }]} value={emergencyRelation} onChangeText={setEmergencyRelation} placeholder="e.g. Spouse, Parent, Sibling" placeholderTextColor={theme.textMuted} />
        </GlassCard>

        <PressableButton onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.primary }]} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </PressableButton>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomSheet visible={avatarSheetVisible} onClose={() => setAvatarSheetVisible(false)}>
        <PressableButton onPress={handleTakePhoto} style={styles.sheetOption}>
          <Ionicons name="camera-outline" size={22} color={theme.text} />
          <Text style={[styles.sheetOptionText, { color: theme.text }]}>Take Photo</Text>
        </PressableButton>
        <PressableButton onPress={handleChooseGallery} style={styles.sheetOption}>
          <Ionicons name="image-outline" size={22} color={theme.text} />
          <Text style={[styles.sheetOptionText, { color: theme.text }]}>Choose from Gallery</Text>
        </PressableButton>
        <PressableButton onPress={handleRemoveAvatar} style={styles.sheetOption}>
          <Ionicons name="trash-outline" size={22} color={theme.danger} />
          <Text style={[styles.sheetOptionText, { color: theme.danger }]}>Remove</Text>
        </PressableButton>
      </BottomSheet>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarHint: { fontSize: 13, marginTop: 8 },
  card: { marginBottom: 16, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15 },
  readOnly: { opacity: 0.6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  saveButton: { marginTop: 8, marginBottom: 16, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bottomSpacer: { height: 40 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14 },
  sheetOptionText: { fontSize: 16, fontWeight: '500' },
});
