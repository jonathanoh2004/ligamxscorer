import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liga MX Scorer</Text>
      <Text style={styles.welcome}>Welcome, {user?.username}</Text>
      <Text style={styles.placeholder}>Leaderboard coming soon...</Text>
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 32,
  },
  placeholder: {
    color: '#555',
    marginBottom: 48,
  },
  button: {
    backgroundColor: '#6b1111',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
  },
});
