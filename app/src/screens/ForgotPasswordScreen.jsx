import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  ScreenHeader,
  GlassCard,
  PressableButton,
} from '../components/ui';
import haptics from '../utils/haptics';
import api from '../api/axios';

export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    if (!email.trim()) {
      haptics.error();
      setError('Please enter your email address');
      return;
    }
    haptics.medium();
    setLoading(true);
    try {
      await api.post('/api/v1/auth/forgot-password', { email: email.trim() });
      haptics.selection();
      setStep(2);
    } catch (err) {
      haptics.error();
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    if (!otp.trim()) {
      haptics.error();
      setError('Please enter the OTP');
      return;
    }
    if (!password) {
      haptics.error();
      setError('Please enter a new password');
      return;
    }
    if (password !== confirmPassword) {
      haptics.error();
      setError('Passwords do not match');
      return;
    }
    haptics.medium();
    setLoading(true);
    try {
      await api.post('/api/v1/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        password,
      });
      haptics.success();
      Alert.alert('Success', 'Password reset!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      haptics.error();
      setError(err?.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.gradient[0], theme.gradient[2]]} style={styles.container}>
      <ScreenHeader title="Forgot Password" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="lock-closed" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {step === 1 ? 'Reset Your Password' : 'Enter New Password'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {step === 1
              ? 'Enter your email and we\'ll send you an OTP'
              : 'Enter the OTP sent to your email and set a new password'}
          </Text>
        </View>

        <GlassCard style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>OTP Code</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={otp}
                onChangeText={setOtp}
                placeholder="4-digit OTP"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={[styles.label, { color: theme.textSecondary }]}>New Password</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={password}
                onChangeText={setPassword}
                placeholder="New password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
              />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
              />
            </>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={theme.danger} />
              <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
            </View>
          ) : null}

          <PressableButton
            onPress={step === 1 ? handleSendOTP : handleResetPassword}
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Reset Password'}
            </Text>
          </PressableButton>

          {step === 2 && (
            <PressableButton
              onPress={() => { haptics.selection(); setStep(1); setError(''); }}
              style={styles.backLink}
            >
              <Text style={[styles.backLinkText, { color: theme.primary }]}>
                ← Back to email
              </Text>
            </PressableButton>
          )}
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  iconContainer: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  card: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 4 },
  errorText: { fontSize: 13, flex: 1 },
  submitButton: { marginTop: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { fontSize: 14, fontWeight: '600' },
});
