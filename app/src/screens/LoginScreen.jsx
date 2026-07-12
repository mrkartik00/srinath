import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Urbanist_600SemiBold, Urbanist_700Bold } from '@expo-google-fonts/urbanist';
import { useTheme } from '../context/ThemeContext';
import { GlassCard, PressableButton, PageLoader, Logo } from '../components/ui';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts({ Urbanist_600SemiBold, Urbanist_700Bold });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const { login } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 6 }),
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 8, bounciness: 10 }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      haptics.error();
      return Alert.alert('Error', 'Please fill all fields');
    }
    haptics.medium();
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      haptics.success();
      await login(res.data.accessToken, res.data.user);
    } catch (err) {
      haptics.error();
      const msg = err?.response?.data?.code || err?.response?.data?.message || '';
      if (msg === 'EMAIL_NOT_VERIFIED') {
        return navigation.navigate('VerifyOtp', { email });
      }
      Alert.alert('Login Failed', Array.isArray(err) ? err.join('\n') : (typeof err === 'string' ? err : 'Invalid credentials'));
    }
    finally { setLoading(false); }
  };

  if (!fontsLoaded) {
    return <PageLoader />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <LinearGradient colors={theme.gradient} style={styles.bgGradient} />

      {/* Decorative circles */}
      <View style={[styles.circle1, { backgroundColor: `${theme.primary}0D` }]} />
      <View style={[styles.circle2, { backgroundColor: `${theme.primary}08` }]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
              <View style={[styles.logoBox, { backgroundColor: theme.card }]}>
                <Logo size={32} color={theme.primary} />
              </View>
              <Text style={[styles.brandName, { color: theme.text }]}>Janki Care</Text>
              <Text style={[styles.brandSub, { color: theme.textMuted }]}>by Dr. Srinath Rathod</Text>
            </Animated.View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>Welcome{'\n'}back</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sign in to continue your health journey</Text>

            {/* Form */}
            <GlassCard style={styles.form}>
              {/* Email */}
              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="mail" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={[styles.inputContainer, { backgroundColor: `${theme.textMuted}0D`, borderColor: `${theme.textMuted}20` }]}>
                <View style={[styles.inputIconBox, { backgroundColor: theme.chipBg }]}>
                  <Ionicons name="lock-closed" size={18} color={theme.primary} />
                </View>
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={secureText}
                />
                <PressableButton onPress={() => { haptics.selection(); setSecureText(!secureText); }} hapticType="selection" style={styles.eyeBtn}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={18} color={theme.textMuted} />
                </PressableButton>
              </View>

              {/* Sign In Button */}
              <PressableButton onPress={handleLogin} hapticType="medium" disabled={loading} style={styles.btnWrapper} scaleTo={0.97}>
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark || theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btn}
                >
                  {loading ? (
                    <Ionicons name="hourglass" size={20} color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </PressableButton>
            </GlassCard>

            {/* Footer */}
            <PressableButton onPress={() => { haptics.light(); navigation.navigate('Register'); }} hapticType="light" style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account? </Text>
              <Text style={[styles.footerLink, { color: theme.primary }]}>Create one</Text>
            </PressableButton>

            {/* Trust */}
            <View style={styles.trust}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={14} color={theme.success} />
                <Text style={[styles.trustText, { color: theme.textMuted }]}>Secure</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="finger-print" size={14} color={theme.teal} />
                <Text style={[styles.trustText, { color: theme.textMuted }]}>Private</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="medical" size={14} color={theme.warning} />
                <Text style={[styles.trustText, { color: theme.textMuted }]}>HIPAA</Text>
              </View>
            </View>
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
  circle1: { position: 'absolute', top: -120, right: -80, width: 280, height: 280, borderRadius: 140 },
  circle2: { position: 'absolute', bottom: -100, left: -60, width: 220, height: 220, borderRadius: 110 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingTop: Platform.OS === 'ios' ? 80 : 40 },
  logoSection: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#223263',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: { fontSize: 24, fontFamily: 'Urbanist_700Bold', marginTop: 12, letterSpacing: -0.5 },
  brandSub: { fontSize: 13, fontFamily: 'Urbanist_600SemiBold', marginTop: 2, letterSpacing: 0.3 },
  title: { fontSize: 38, fontFamily: 'Urbanist_700Bold', lineHeight: 44, letterSpacing: -1 },
  subtitle: { fontSize: 15, fontFamily: 'Urbanist_600SemiBold', marginTop: 8, marginBottom: 28 },
  form: { gap: 14, borderRadius: 24, padding: 20 },
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
  trust: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 32 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 12, fontFamily: 'Urbanist_600SemiBold' },
});
