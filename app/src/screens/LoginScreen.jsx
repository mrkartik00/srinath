import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableButton from '../components/ui/PressableButton';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A2E', '#16213E']}
        style={styles.bgGradient}
      />

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
              <LinearGradient
                colors={['#007AFF', '#0056CC']}
                style={styles.logoBox}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="heart" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.brandName}>Janki Care</Text>
              <Text style={styles.brandSub}>Premium Healthcare</Text>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>Welcome{'\n'}back</Text>
            <Text style={styles.subtitle}>Sign in to continue your health journey</Text>

            {/* Form */}
            <View style={styles.form}>
              {/* Email */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="mail" size={18} color="#007AFF" />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor="#4A4A6A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="lock-closed" size={18} color="#007AFF" />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#4A4A6A"
                  secureTextEntry={secureText}
                />
                <PressableButton onPress={() => { haptics.selection(); setSecureText(!secureText); }} hapticType="selection" style={styles.eyeBtn}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={18} color="#4A4A6A" />
                </PressableButton>
              </View>

              {/* Sign In Button */}
              <PressableButton onPress={handleLogin} hapticType="medium" disabled={loading} style={styles.btnWrapper} scaleTo={0.97}>
                <LinearGradient
                  colors={['#007AFF', '#0056CC']}
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
            </View>

            {/* Footer */}
            <PressableButton onPress={() => { haptics.light(); navigation.navigate('Register'); }} hapticType="light" style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text style={styles.footerLink}>Create one</Text>
            </PressableButton>

            {/* Trust */}
            <View style={styles.trust}>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark" size={14} color="#34C759" />
                <Text style={styles.trustText}>Secure</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="finger-print" size={14} color="#5AC8FA" />
                <Text style={styles.trustText}>Private</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="medical" size={14} color="#FF9500" />
                <Text style={styles.trustText}>HIPAA</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  flex: { flex: 1 },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  circle1: { position: 'absolute', top: -SCREEN_HEIGHT * 0.15, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0,122,255,0.08)' },
  circle2: { position: 'absolute', bottom: -100, left: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(0,122,255,0.05)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingTop: Platform.OS === 'ios' ? 80 : 40 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  brandName: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 12, letterSpacing: -0.5 },
  brandSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '500', letterSpacing: 0.5 },
  title: { fontSize: 38, fontWeight: '700', color: '#fff', lineHeight: 44, letterSpacing: -1 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 32 },
  form: { gap: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 4 },
  inputIconBox: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#fff' },
  eyeBtn: { padding: 10 },
  btnWrapper: { marginTop: 8, borderRadius: 14, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 17 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },
  footerLink: { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  trust: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 32 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '500' },
});
