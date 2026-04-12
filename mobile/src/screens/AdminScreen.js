import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { matchesByWeek } from '../graphql/queries';
import { updateMatch, adminSync } from '../graphql/mutations';
import { useLang } from '../context/LanguageContext';
import dayjs from 'dayjs';

const client = generateClient();

function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function getCurrentWeekId() {
  const now = dayjs();
  return `${now.year()}-W${String(getISOWeek(now.toDate())).padStart(2, '0')}`;
}

async function invokeAdminSync(action) {
  const res = await client.graphql({
    query: adminSync,
    variables: { action },
  });
  return res.data.adminSync;
}

export default function AdminScreen() {
  const { t, fmtWeek, fmtDate } = useLang();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const weekId = getCurrentWeekId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.graphql({
        query: matchesByWeek,
        variables: { weekId, limit: 20 },
      });
      setMatches(
        res.data.matchesByWeek.items
          .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate))
      );
    } catch (err) {
      Alert.alert('Error', 'Could not load matches. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [weekId]);

  useEffect(() => { load(); }, [load]);

  const weekLocked = matches.length > 0 && matches.every(m => m.locked);
  const weekUnlocked = matches.length > 0 && matches.every(m => !m.locked);

  async function setAllLocked(locked) {
    const key = locked ? 'lockWeek' : 'unlockWeek';
    setActionLoading(key);
    try {
      await Promise.all(
        matches.map(m =>
          client.graphql({ query: updateMatch, variables: { input: { id: m.id, locked } } })
        )
      );
      setMatches(prev => prev.map(m => ({ ...m, locked })));
      Alert.alert(t.done, locked ? t.lockDoneMsg : t.unlockDoneMsg);
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function toggleMatchLock(match) {
    const newLocked = !match.locked;
    setActionLoading(match.id);
    try {
      await client.graphql({
        query: updateMatch,
        variables: { input: { id: match.id, locked: newLocked } },
      });
      setMatches(prev => prev.map(m => m.id === match.id ? { ...m, locked: newLocked } : m));
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setActionLoading(null);
    }
  }

  async function runSync(action) {
    setActionLoading(action);
    try {
      await invokeAdminSync(action);
      Alert.alert(t.done, action === 'fixtures' ? t.syncedMsg : t.scoredMsg);
      if (action === 'fixtures') load();
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.section}>{t.adminTitle}</Text>
      <Text style={styles.weekLabel}>{fmtWeek(weekId)}</Text>

      {/* Week-level lock/unlock */}
      <View style={styles.rowBtns}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.lockBtn, weekLocked && styles.btnDisabled]}
          onPress={() => setAllLocked(true)}
          disabled={!!actionLoading || weekLocked}
        >
          {actionLoading === 'lockWeek'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.actionBtnText}>{t.lockWeek}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.unlockBtn, weekUnlocked && styles.btnDisabled]}
          onPress={() => setAllLocked(false)}
          disabled={!!actionLoading || weekUnlocked}
        >
          {actionLoading === 'unlockWeek'
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.actionBtnText}>{t.unlockWeek}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Per-match toggle */}
      <Text style={styles.subSection}>{t.individualMatches}</Text>
      {matches.length === 0 && (
        <Text style={styles.empty}>{t.noMatchesAdmin}</Text>
      )}
      {matches.map(m => (
        <View key={m.id} style={styles.matchRow}>
          <View style={styles.matchInfo}>
            <Text style={styles.matchTeams}>{m.homeTeam} vs {m.awayTeam}</Text>
            <Text style={styles.matchDate}>{fmtDate(m.matchDate)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, (m.locked || new Date(m.matchDate) <= new Date()) ? styles.toggleLocked : styles.toggleOpen]}
            onPress={() => toggleMatchLock(m)}
            disabled={actionLoading === m.id}
          >
            {actionLoading === m.id
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.toggleText}>{(m.locked || new Date(m.matchDate) <= new Date()) ? t.locked2 : t.open}</Text>
            }
          </TouchableOpacity>
        </View>
      ))}

      {/* Lambda triggers */}
      <Text style={styles.subSection}>{t.apiSync}</Text>

      <TouchableOpacity
        style={[styles.actionBtn, styles.syncBtn, actionLoading === 'fixtures' && styles.btnDisabled]}
        onPress={() => runSync('fixtures')}
        disabled={!!actionLoading}
      >
        {actionLoading === 'fixtures'
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.actionBtnText}>{t.syncFixtures}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.scoreBtn, actionLoading === 'results' && styles.btnDisabled]}
        onPress={() => runSync('results')}
        disabled={!!actionLoading}
      >
        {actionLoading === 'results'
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.actionBtnText}>{t.scoreResults}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  section: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  weekLabel: { color: '#4a9eff', fontSize: 13, marginBottom: 20 },
  subSection: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginTop: 24, marginBottom: 10, letterSpacing: 1 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, padding: 14, borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', minHeight: 48, marginBottom: 8,
  },
  lockBtn: { backgroundColor: '#6b3a1a' },
  unlockBtn: { backgroundColor: '#1a4a30' },
  syncBtn: { backgroundColor: '#1a3a6b', marginBottom: 10 },
  scoreBtn: { backgroundColor: '#4a2a6b' },
  btnDisabled: { opacity: 0.4 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  matchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111e33',
    borderRadius: 8, padding: 12, marginBottom: 8,
  },
  matchInfo: { flex: 1 },
  matchTeams: { color: '#fff', fontSize: 14, fontWeight: '600' },
  matchDate: { color: '#888', fontSize: 11, marginTop: 2 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, minWidth: 70, alignItems: 'center' },
  toggleLocked: { backgroundColor: '#6b1a1a' },
  toggleOpen: { backgroundColor: '#1a6b3a' },
  toggleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 10 },
});
