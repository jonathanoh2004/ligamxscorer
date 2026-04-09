import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { matchesByWeek, predictionsByWeek, membersByGroup } from '../graphql/queries';
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

const CELL_COLORS = { H: '#1a6b3a', D: '#3a3a5c', A: '#6b1a1a' };

export default function WeeklyGridScreen({ group }) {
  const { t, fmtDate, fmtWeek } = useLang();
  const [matches, setMatches] = useState([]);
  const [grid, setGrid] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const weekId = getCurrentWeekId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberRes = await client.graphql({
        query: membersByGroup,
        variables: { groupId: group.id, limit: 100 },
      });
      const groupUsernames = new Set(memberRes.data.membersByGroup.items.map(m => m.username));

      const [matchRes, predRes] = await Promise.all([
        client.graphql({ query: matchesByWeek, variables: { weekId, limit: 20 } }),
        client.graphql({ query: predictionsByWeek, variables: { weekId, limit: 500 } }),
      ]);

      const fetchedMatches = matchRes.data.matchesByWeek.items
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

      const preds = predRes.data.predictionsByWeek.items.filter(p => groupUsernames.has(p.username));

      const gridMap = {};
      for (const p of preds) {
        if (!gridMap[p.username]) gridMap[p.username] = {};
        gridMap[p.username][p.matchId] = p.prediction;
      }

      setMatches(fetchedMatches);
      setGrid(gridMap);
      setUsers(Array.from(groupUsernames).sort());
    } catch (err) {
      Alert.alert(t.errorTitle, t.failedGrid + ' ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [weekId, group.id, t]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;
  if (!matches.length) return <View style={styles.center}><Text style={styles.emptyText}>{t.noMatches}</Text></View>;

  const COL_WIDTH = 64;
  const ROW_LABEL_WIDTH = 90;

  return (
    <View style={styles.container}>
      <Text style={styles.weekLabel}>{fmtWeek(weekId)} · {group.name}</Text>
      <ScrollView horizontal refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}>
        <View>
          <View style={styles.row}>
            <View style={[styles.cornerCell, { width: ROW_LABEL_WIDTH }]} />
            {matches.map(m => (
              <View key={m.matchId} style={[styles.headerCell, { width: COL_WIDTH }]}>
                <Text style={styles.headerHome} numberOfLines={1}>{m.homeTeam.split(' ')[0]}</Text>
                <Text style={styles.headerVs}>vs</Text>
                <Text style={styles.headerAway} numberOfLines={1}>{m.awayTeam.split(' ')[0]}</Text>
                <Text style={styles.headerDate}>{fmtDate(m.matchDate, t.colDateFormat)}</Text>
              </View>
            ))}
          </View>
          <ScrollView>
            {users.length === 0
              ? <Text style={[styles.emptyText, { margin: 16 }]}>{t.noPredictions}</Text>
              : users.map(username => (
                <View key={username} style={styles.row}>
                  <View style={[styles.userCell, { width: ROW_LABEL_WIDTH }]}>
                    <Text style={styles.username} numberOfLines={1}>{username}</Text>
                  </View>
                  {matches.map(m => {
                    const pick = grid[username]?.[m.matchId];
                    return (
                      <View
                        key={m.matchId}
                        style={[styles.cell, { width: COL_WIDTH }, pick ? { backgroundColor: CELL_COLORS[pick] } : null]}
                      >
                        <Text style={styles.cellText}>{pick || '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              ))
            }
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', paddingTop: 12 },
  center: { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  weekLabel: { color: '#888', fontSize: 13, marginBottom: 8, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  cornerCell: { height: 64 },
  headerCell: { height: 64, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40', padding: 4 },
  headerHome: { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  headerVs: { color: '#555', fontSize: 9 },
  headerAway: { color: '#aaa', fontSize: 10, textAlign: 'center' },
  headerDate: { color: '#555', fontSize: 9, marginTop: 2 },
  userCell: { height: 44, justifyContent: 'center', paddingHorizontal: 10 },
  username: { color: '#fff', fontSize: 13 },
  cell: { height: 44, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40', backgroundColor: '#111e33' },
  cellText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText: { color: '#888', fontSize: 15 },
});
