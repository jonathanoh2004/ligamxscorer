import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { matchesByWeek, predictionsByUser } from '../graphql/queries';
import { createPrediction, updatePrediction } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
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

export default function MyPicksScreen() {
  const { user } = useAuth();
  const { t, fmtDate, fmtWeek } = useLang();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const weekId = getCurrentWeekId();

  const OPTIONS = [
    { key: 'H', label: t.homeWin },
    { key: 'D', label: t.draw },
    { key: 'A', label: t.awayWin },
  ];
  const OPTION_COLORS = { H: '#1a6b3a', D: '#3a3a5c', A: '#6b1a1a' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [matchRes, predRes] = await Promise.all([
        client.graphql({ query: matchesByWeek, variables: { weekId, limit: 20 } }),
        client.graphql({ query: predictionsByUser, variables: { username: user.username, limit: 50 } }),
      ]);
      const fetchedMatches = matchRes.data.matchesByWeek.items
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
      const predMap = {};
      for (const p of predRes.data.predictionsByUser.items) {
        if (p.weekId === weekId) predMap[p.matchId] = { id: p.id, prediction: p.prediction };
      }
      setMatches(fetchedMatches);
      setPredictions(predMap);
    } catch (err) {
      Alert.alert(t.errorTitle, t.failedMatches + ' ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [weekId, user.username, t]);

  useEffect(() => { load(); }, [load]);

  async function pick(match, option) {
    if (match.locked) return;
    const existing = predictions[match.matchId];
    setSaving(match.matchId);
    try {
      if (existing) {
        await client.graphql({
          query: updatePrediction,
          variables: { input: { id: existing.id, prediction: option } },
        });
        setPredictions(prev => ({ ...prev, [match.matchId]: { ...existing, prediction: option } }));
      } else {
        const res = await client.graphql({
          query: createPrediction,
          variables: {
            input: {
              username: user.username,
              weekMatchId: `${weekId}#${match.matchId}`,
              weekId,
              matchId: match.matchId,
              prediction: option,
            },
          },
        });
        const created = res.data.createPrediction;
        setPredictions(prev => ({ ...prev, [match.matchId]: { id: created.id, prediction: option } }));
      }
    } catch (err) {
      Alert.alert(t.errorTitle, t.couldNotSave + ' ' + (err.message || ''));
    } finally {
      setSaving(null);
    }
  }

  function renderMatch({ item }) {
    const myPick = predictions[item.matchId]?.prediction;
    const isLocked = item.locked;
    const isSaving = saving === item.matchId;

    return (
      <View style={styles.card}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchDate}>
            {fmtDate(item.matchDate)}
          </Text>
          {isLocked && <Text style={styles.lockedBadge}>{t.locked}</Text>}
        </View>
        <Text style={styles.matchup}>
          {item.homeTeam} <Text style={styles.vs}>vs</Text> {item.awayTeam}
        </Text>
        <View style={styles.options}>
          {OPTIONS.map(({ key, label }) => {
            const selected = myPick === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optBtn,
                  { backgroundColor: selected ? OPTION_COLORS[key] : '#1a2a40' },
                  isLocked && styles.optDisabled,
                ]}
                onPress={() => pick(item, key)}
                disabled={isLocked || isSaving}
              >
                <Text style={[styles.optLabel, selected && styles.optLabelSelected]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {isSaving && <ActivityIndicator style={styles.saving} color="#4a9eff" size="small" />}
      </View>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;

  if (!matches.length) return <View style={styles.center}><Text style={styles.emptyText}>{t.noMatches}</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.weekLabel}>{fmtWeek(weekId)}</Text>
      <FlatList
        data={matches}
        keyExtractor={item => item.matchId}
        renderItem={renderMatch}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 12 },
  center: { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  weekLabel: { color: '#888', fontSize: 13, marginBottom: 10, marginLeft: 4 },
  card: { backgroundColor: '#111e33', borderRadius: 10, padding: 14, marginBottom: 12 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  matchDate: { color: '#888', fontSize: 12 },
  lockedBadge: { color: '#f0a500', fontSize: 11, fontWeight: '700' },
  matchup: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  vs: { color: '#888', fontWeight: '400' },
  options: { flexDirection: 'row', gap: 8 },
  optBtn: { flex: 1, borderRadius: 7, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2a3a50' },
  optDisabled: { opacity: 0.5 },
  optLabel: { color: '#888', fontSize: 13, fontWeight: '700' },
  optLabelSelected: { color: '#fff' },
  saving: { position: 'absolute', top: 12, right: 12 },
  emptyText: { color: '#888', fontSize: 15 },
});
