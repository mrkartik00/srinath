import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PressableButton from '../components/ui/PressableButton';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { haptics } from '../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0A0A', '#1A1A2E', '#16213E']} style={styles.bgGradient} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Logo */}
            <View style={styles.logoSection}>
              <LinearGradient colors={['#007AFF', '#0056CC']} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="heart" size={28} color="#fff" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Create{'\n'}account</Text>
            <Text style={styles.subtitle}>Join thousands managing their health with ease</Text>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="person" size={18} color="#007AFF" />
                </View>
                <TextInput style={styles.input} value={form.name} onChangeText={(v) => update('name', v)} placeholder="Full Name" placeholderTextColor="#4A4A6A" />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="mail" size={18} color="#007AFF" />
                </View>
                <TextInput style={styles.input} value={form.email} onChangeText={(v) => update('email', v)} placeholder="Email address" placeholderTextColor="#4A4A6A" keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="lock-closed" size={18} color="#007AFF" />
                </View>
                <TextInput style={styles.input} value={form.password} onChangeText={(v) => update('password', v)} placeholder="Password (min 6 chars)" placeholderTextColor="#4A4A6A" secureTextEntry={secureText} />
                <PressableButton onPress={() => { haptics.selection(); setSecureText(!secureText); }} hapticType="selection" style={styles.eyeBtn}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={18} color="#4A4A6A" />
                </PressableButton>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconBox}>
                  <Ionicons name="call" size={18} color="#007AFF" />
                </View>
                <TextInput style={styles.input} value={form.phone} onChangeText={(v) => update('phone', v)} placeholder="Phone (optional)" placeholderTextColor="#4A4A6A" keyboardType="phone-pad" />
              </View>

              {/* Submit */}
              <PressableButton onPress={handleRegister} hapticType="medium" disabled={loading} style={styles.btnWrapper} scaleTo={0.97}>
                <LinearGradient colors={['#007AFF', '#0056CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
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
            </View>

            {/* Footer */}
            <PressableButton onPress={() => { haptics.light(); navigation.navigate('Login'); }} hapticType="light" style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text style={styles.footerLink}>Sign In</Text>
            </PressableButton>
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
  circle1: { position: 'absolute', top: -SCREEN_HEIGHT * 0.12, left: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(0,122,255,0.06)' },
  circle2: { position: 'absolute', bottom: -80, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,122,255,0.04)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28, paddingTop: Platform.OS === 'ios' ? 60 : 30 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  title: { fontSize: 36, fontWeight: '700', color: '#fff', lineHeight: 42, letterSpacing: -0.8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8, marginBottom: 28 },
  form: { gap: 12 },
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
});
