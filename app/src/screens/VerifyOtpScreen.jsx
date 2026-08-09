import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableButton from '../components/ui/PressableButton';
import { sendOtp, verifyOtp, login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';

export default function VerifyOtpScreen({ route, navigation }) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);
  const { login } = useAuth();

  useEffect(() => {
    // Auto-send OTP on mount
    sendOtp(email, 'registration').catch(() => {});
  }, [email]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return Alert.alert('Error', 'Enter complete OTP');
    setLoading(true);
    try {
      await verifyOtp(email, code, 'registration');
      haptics.success();
      Alert.alert('Verified', 'Email verified! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      haptics.error();
      Alert.alert('Failed', err?.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      await sendOtp(email, 'registration');
      haptics.success();
      Alert.alert('Sent', 'New OTP sent to your email');
    } catch { Alert.alert('Error', 'Could not resend OTP'); }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#1A1A2E', '#16213E']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <Ionicons name="mail-open" size={48} color="#007AFF" style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={ref => inputs.current[i] = ref}
                style={styles.otpInput}
                value={digit}
                onChangeText={t => handleChange(t, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <PressableButton onPress={handleVerify} disabled={loading} style={styles.btnWrap}>
            <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.btn}>
              <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify'}</Text>
            </LinearGradient>
          </PressableButton>

          <PressableButton onPress={handleResend} style={styles.resend}>
            <Text style={styles.resendText}>Resend Code</Text>
          </PressableButton>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1, justifyContent: 'center' },
  content: { padding: 28 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 32 },
  otpInput: { width: 44, height: 52, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 22, textAlign: 'center', fontWeight: '600' },
  btnWrap: { borderRadius: 14 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  resend: { marginTop: 20, alignItems: 'center' },
  resendText: { color: '#007AFF', fontSize: 15, fontWeight: '500' },
});
