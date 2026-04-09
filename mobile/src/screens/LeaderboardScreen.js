import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { membersByGroup, scoresBySeason, scoresByWeek } from '../graphql/queries';
import { useLang } from '../context/LanguageContext';
import dayjs from 'dayjs';

const client = generateClient();
const SEASON = '2025';

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

export default function LeaderboardScreen({ group }) {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('season');
  const weekId = getCurrentWeekId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberRes = await client.graphql({
        query: membersByGroup,
        variables: { groupId: group.id, limit: 100 },
      });
      const usernames = memberRes.data.membersByGroup.items.map(m => m.username);

      const [seasonRes, weekRes] = await Promise.all([
        client.graphql({ query: scoresBySeason, variables: { season: SEASON, limit: 200 } }),
        client.graphql({ query: scoresByWeek, variables: { weekId, limit: 200 } }),
      ]);

      const seasonMap = {};
      for (const s of seasonRes.data.scoresBySeason.items) seasonMap[s.username] = s.totalScore;

      const weekMap = {};
      for (const w of weekRes.data.scoresByWeek.items) weekMap[w.username] = w.score;

      setRows(usernames.map(u => ({ username: u, season: seasonMap[u] ?? 0, weekly: weekMap[u] ?? 0 })));
    } catch (err) {
      Alert.alert(t.errorTitle, t.failedLeaderboard + ' ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [group.id, weekId, t]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...rows].sort((a, b) =>
    view === 'season' ? b.season - a.season : b.weekly - a.weekly
  );

  if (loading) return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'season' && styles.toggleActive]}
          onPress={() => setView('season')}
        >
          <Text style={[styles.toggleText, view === 'season' && styles.toggleTextActive]}>{t.season}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'week' && styles.toggleActive]}
          onPress={() => setView('week')}
        >
          <Text style={[styles.toggleText, view === 'week' && styles.toggleTextActive]}>{t.thisWeek}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.rankCol]}>#</Text>
        <Text style={[styles.headerCell, styles.nameCol]}>{t.player}</Text>
        <Text style={[styles.headerCell, styles.scoreCol]}>{t.points}</Text>
      </View>

      <ScrollView>
        {sorted.map((row, i) => {
          const pts = view === 'season' ? row.season : row.weekly;
          const isFirst = i === 0 && pts > 0;
          return (
            <View key={row.username} style={[styles.dataRow, i % 2 === 0 && styles.rowAlt]}>
              <Text style={[styles.cell, styles.rankCol, isFirst && styles.gold]}>{i + 1}</Text>
              <Text style={[styles.cell, styles.nameCol]} numberOfLines={1}>{row.username}</Text>
              <Text style={[styles.cell, styles.scoreCol, styles.scoreText, isFirst && styles.gold]}>{pts}</Text>
            </View>
          );
        })}
        {sorted.length === 0 && <Text style={styles.empty}>{t.noScores}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  toggle: { flexDirection: 'row', margin: 12, backgroundColor: '#111e33', borderRadius: 8, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  toggleActive: { backgroundColor: '#006847' },
  toggleText: { color: '#888', fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  headerCell: { color: '#555', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  dataRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' },
  rowAlt: { backgroundColor: '#0d1a2d' },
  cell: { color: '#fff', fontSize: 15 },
  rankCol: { width: 32 },
  nameCol: { flex: 1 },
  scoreCol: { width: 60, textAlign: 'right' },
  scoreText: { fontWeight: '700', fontSize: 18 },
  gold: { color: '#f0a500' },
  empty: { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 14 },
});
