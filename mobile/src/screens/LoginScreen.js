import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

function PasswordRequirement({ met, label }) {
  return (
    <View style={styles.reqRow}>
      <Text style={[styles.reqDot, met ? styles.reqMet : styles.reqUnmet]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.reqText, met ? styles.reqMet : styles.reqUnmet]}>
        {label}
      </Text>
    </View>
  );
}

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const reqs = {
    length: password.length >= 8,
  };
  const allReqsMet = Object.values(reqs).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  async function handleSubmit() {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required.');
      return;
    }
    if (mode === 'register') {
      if (!allReqsMet) {
        Alert.alert('Error', 'Password must be at least 8 characters.');
        return;
      }
      if (!passwordsMatch) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
        Alert.alert('Account created!', 'You can now log in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      Alert.alert('Error', err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Liga MX Scorer</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>

        {/* Username */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        {/* Password */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.inputFlex}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
            <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {/* Password requirements — show when registering and field is focused or has content */}
        {mode === 'register' && (passwordFocused || password.length > 0) && (
          <View style={styles.reqBox}>
            <PasswordRequirement met={reqs.length} label="At least 8 characters" />
          </View>
        )}

        {/* Confirm password — register only */}
        {mode === 'register' && (
          <>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(v => !v)}>
                <Text style={styles.eyeText}>{showConfirm ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && (
              <View style={styles.reqBox}>
                <PasswordRequirement met={passwordsMatch} label="Passwords match" />
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Register'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={switchMode}>
          <Text style={styles.toggleText}>
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a2a40',
    color: '#fff',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a40',
    borderRadius: 8,
    marginBottom: 12,
  },
  inputFlex: {
    flex: 1,
    color: '#fff',
    padding: 14,
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  eyeText: {
    color: '#4a9eff',
    fontSize: 13,
    fontWeight: '500',
  },
  reqBox: {
    width: '100%',
    paddingHorizontal: 4,
    marginTop: -6,
    marginBottom: 10,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  reqDot: {
    fontSize: 13,
    marginRight: 6,
    fontWeight: '700',
  },
  reqText: {
    fontSize: 13,
  },
  reqMet: {
    color: '#4caf50',
  },
  reqUnmet: {
    color: '#888',
  },
  button: {
    width: '100%',
    backgroundColor: '#006847',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    color: '#4a9eff',
    fontSize: 14,
  },
});
