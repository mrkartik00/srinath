import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { GlassCard, PressableButton, PageLoader, Logo } from '../components/ui';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const { login } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 6 }),
    ]).start();
  }, []);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      haptics.error();
      return Alert.alert('Error', 'Fill required fields');
    }
    haptics.medium();
    setLoading(true);
    try {
      await register({ ...form, role: 'patient' });
      haptics.success();
      navigation.navigate('VerifyOtp', { email: form.email });
    } catch (err) {
      haptics.error();
      Alert.alert('Failed', Array.isArray(err) ? err.join('\n') : (typeof err === 'string' ? err : 'Try again'));
    }
    finally { setLoading(false); }
  };

  if (!fontsLoaded) {
    return <PageLoader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradient} style={styles.bgGradient} />
      <View style={[styles.circle1, { backgroundColor: `${theme.primary}0D` }]} />
      <View style={[styles.circle2, { backgroundColor: `${theme.primary}08` }]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={[styles.logoBox, { backgroundColor: theme.card }]}>
                <Logo size={28} color={theme.primary} />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>Create{'\n'}account</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Join thousands managing their health with ease</Text>

            {/* Form */}
            <GlassCard style={styles.form}>
              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="person" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={form.name}
                  onChangeText={(v) => update('name', v)}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="mail" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={form.email}
                  onChangeText={(v) => update('email', v)}
                  placeholder="Email address"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="lock-closed" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={form.password}
                  onChangeText={(v) => update('password', v)}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={secureText}
                />
                <PressableButton onPress={() => { haptics.selection(); setSecureText(!secureText); }} hapticType="selection" style={styles.eyeBtn}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={18} color={theme.textMuted} />
                </PressableButton>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="call" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={form.phone}
                  onChangeText={(v) => update('phone', v)}
                  placeholder="Phone (optional)"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Submit */}
              <PressableButton onPress={handleRegister} hapticType="medium" disabled={loading} style={styles.btnWrapper} scaleTo={0.97}>
                <LinearGradient colors={[theme.primary, theme.primaryDark || theme.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
                  {loading ? (
                    <Ionicons name="hourglass" size={20} color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </PressableButton>
            </GlassCard>

            {/* Footer */}
            <PressableButton onPress={() => { haptics.light(); navigation.navigate('Login'); }} hapticType="light" style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account? </Text>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Sign In</Text>
            </PressableButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  circle1: { position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: 130 },
  circle2: { position: 'absolute', bottom: -80, right: -60, width: 200, height: 200, borderRadius: 100 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#223263',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  title: { fontSize: 36, fontFamily: 'Urbanist_700Bold', lineHeight: 42, letterSpacing: -0.8 },
  subtitle: { fontSize: 15, fontFamily: 'Urbanist_600SemiBold', marginTop: 8, marginBottom: 26 },
  form: { gap: 12, borderRadius: 24, padding: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 4 },
  inputIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontFamily: 'Urbanist_600SemiBold' },
  eyeBtn: { padding: 10 },
  btnWrapper: { marginTop: 8, borderRadius: 16, shadowColor: '#223263', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 17 },
  btnText: { color: '#fff', fontSize: 17, fontFamily: 'Urbanist_700Bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15, fontFamily: 'Urbanist_600SemiBold' },
  footerLink: { fontSize: 15, fontFamily: 'Urbanist_700Bold' },
});
