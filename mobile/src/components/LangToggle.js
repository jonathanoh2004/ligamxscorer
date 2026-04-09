import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../context/LanguageContext';

export default function LangToggle() {
  const { lang, setLanguage } = useLang();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setLanguage('en')} style={styles.btn}>
        <Text style={[styles.text, lang === 'en' ? styles.active : styles.dim]}>EN</Text>
      </TouchableOpacity>
      <Text style={styles.sep}>|</Text>
      <TouchableOpacity onPress={() => setLanguage('es')} style={styles.btn}>
        <Text style={[styles.text, lang === 'es' ? styles.active : styles.dim]}>ES</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a40',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  btn: { paddingHorizontal: 4 },
  text: { fontSize: 13, fontWeight: '700' },
  active: { color: '#fff' },
  dim: { color: '#3a5070' },
  sep: { color: '#3a5070', fontSize: 13, marginHorizontal: 2 },
});
