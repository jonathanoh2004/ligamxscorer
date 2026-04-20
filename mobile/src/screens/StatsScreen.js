import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { generateClient } from 'aws-amplify/api';
import { predictionsByUser, listMatches } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const client = generateClient();

// ── Ring / donut chart ──────────────────────────────────────────────────────
function RingChart({ correct, wrong }) {
  const size = 150;
  const sw = 16;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const total = correct + wrong;
  const correctArc = total > 0 ? (correct / total) * circ : 0;
  const wrongArc   = total > 0 ? (wrong   / total) * circ : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke="#1a2a40" strokeWidth={sw} fill="none" />
        {total > 0 && (
          <>
            {/* Red arc (wrong) — starts where green ends */}
            <Circle
              cx={cx} cy={cy} r={r}
              stroke="#ef4444" strokeWidth={sw} fill="none"
              strokeDasharray={`${wrongArc} ${circ - wrongArc}`}
              strokeDashoffset={-correctArc}
              rotation="-90" origin={`${cx}, ${cy}`}
            />
            {/* Green arc (correct) — from top */}
            <Circle
              cx={cx} cy={cy} r={r}
              stroke="#22c55e" strokeWidth={sw} fill="none"
              strokeDasharray={`${correctArc} ${circ - correctArc}`}
              strokeDashoffset={0}
              rotation="-90" origin={`${cx}, ${cy}`}
            />
          </>
        )}
      </Svg>
      {/* W - L label in centre */}
      <View style={styles.ringCenter}>
        <Text style={styles.ringCorrect}>{correct}</Text>
        <View style={styles.ringDivider} />
        <Text style={styles.ringWrong}>{wrong}</Text>
      </View>
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function StatsScreen() {
  const { user } = useAuth();
  const { t, fmtDate } = useLang();

  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derived stats
  const [correct, setCorrect]     = useState(0);
  const [wrong, setWrong]         = useState(0);
  const [recent, setRecent]       = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [maxStreak, setMaxStreak] = useState(0);
  const [curStreak, setCurStreak] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all user predictions
      const predRes = await client.graphql({
        query: predictionsByUser,
        variables: { username: user.username, limit: 500 },
      });
      const preds = predRes.data.predictionsByUser.items;

      // Fetch all completed matches (private read, limit covers full season)
      const matchRes = await client.graphql({
        query: listMatches,
        variables: { limit: 500 },
      });
      const matchMap = {};
      for (const m of matchRes.data.listMatches.items) {
        matchMap[m.matchId] = m;
      }

      // Join predictions with match results
      const decided = [];
      for (const p of preds) {
        const m = matchMap[p.matchId];
        if (!m || !m.result) continue; // match not finished or unknown
        decided.push({
          matchId:   p.matchId,
          prediction: p.prediction,
          result:    m.result,
          homeTeam:  m.homeTeam,
          awayTeam:  m.awayTeam,
          matchDate: m.matchDate,
          isCorrect: p.prediction === m.result,
        });
      }

      // Sort chronologically
      decided.sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

      const totalCorrect = decided.filter(d => d.isCorrect).length;
      const totalWrong   = decided.filter(d => !d.isCorrect).length;
      setCorrect(totalCorrect);
      setWrong(totalWrong);

      // Recent predictions (most recent first, up to 20)
      setRecent([...decided].reverse().slice(0, 20));

      // Team accuracy
      const tMap = {};
      for (const d of decided) {
        for (const team of [d.homeTeam, d.awayTeam]) {
          if (!tMap[team]) tMap[team] = { correct: 0, total: 0 };
          tMap[team].total++;
          if (d.isCorrect) tMap[team].correct++;
        }
      }
      const teamArr = Object.entries(tMap)
        .map(([name, s]) => ({ name, correct: s.correct, total: s.total, pct: s.correct / s.total }))
        .filter(t => t.total >= 2)                          // at least 2 predictions involving this team
        .sort((a, b) => b.correct - a.correct || b.pct - a.pct)
        .slice(0, 5);
      setTeamStats(teamArr);

      // Streaks
      let best = 0, curr = 0;
      for (const d of decided) {
        if (d.isCorrect) { curr++; best = Math.max(best, curr); }
        else curr = 0;
      }
      // Current streak: walk backwards
      let cur = 0;
      for (let i = decided.length - 1; i >= 0; i--) {
        if (decided[i].isCorrect) cur++;
        else break;
      }
      setMaxStreak(best);
      setCurStreak(cur);

    } catch (err) {
      Alert.alert(t.errorTitle, 'Could not load stats. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [user.username, t]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;
  }

  const total = correct + wrong;
  const pct   = total > 0 ? Math.round((correct / total) * 100) : 0;

  const PICK_LABELS = { H: 'Home', D: 'Draw', A: 'Away' };
  const RESULT_COLOR = { H: '#22c55e', D: '#6366f1', A: '#ef4444' };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* ── Ring chart section ── */}
      <Text style={styles.sectionTitle}>{t.statsOverview}</Text>
      <View style={styles.ringRow}>
        <RingChart correct={correct} wrong={wrong} />
        <View style={styles.ringLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
            <Text style={styles.legendText}>{t.statsCorrect}: <Text style={styles.legendVal}>{correct}</Text></Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>{t.statsWrong}: <Text style={styles.legendVal}>{wrong}</Text></Text>
          </View>
          <View style={[styles.legendItem, { marginTop: 10 }]}>
            <Text style={styles.pctLabel}>{pct}%</Text>
            <Text style={styles.legendText}> {t.statsAccuracy}</Text>
          </View>
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>{t.statsTotalPicks}: <Text style={styles.legendVal}>{total}</Text></Text>
          </View>
        </View>
      </View>

      {/* ── Streaks ── */}
      <Text style={styles.sectionTitle}>{t.statsStreaks}</Text>
      <View style={styles.streakRow}>
        <View style={styles.streakCard}>
          <Text style={styles.streakNum}>{curStreak}</Text>
          <Text style={styles.streakLabel}>{t.statsCurrent}</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={[styles.streakNum, { color: '#f0a500' }]}>{maxStreak}</Text>
          <Text style={styles.streakLabel}>{t.statsBest}</Text>
        </View>
      </View>

      {/* ── Team accuracy ── */}
      {teamStats.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t.statsTeamTitle}</Text>
          {teamStats.map(ts => (
            <View key={ts.name} style={styles.teamRow}>
              <Text style={styles.teamName} numberOfLines={1}>{ts.name}</Text>
              <View style={styles.teamBarTrack}>
                <View style={[styles.teamBarFill, { width: `${Math.round(ts.pct * 100)}%` }]} />
              </View>
              <Text style={styles.teamStat}>{ts.correct}/{ts.total}</Text>
            </View>
          ))}
        </>
      )}

      {/* ── Recent predictions ── */}
      <Text style={styles.sectionTitle}>{t.statsRecent}</Text>
      {recent.length === 0 && (
        <Text style={styles.empty}>{t.noPredictions}</Text>
      )}
      {recent.map((item, i) => (
        <View
          key={`${item.matchId}-${i}`}
          style={[styles.recentCard, item.isCorrect ? styles.cardCorrect : styles.cardWrong]}
        >
          <View style={styles.recentLeft}>
            <Text style={styles.recentTeams} numberOfLines={1}>
              {item.homeTeam} <Text style={styles.vs}>vs</Text> {item.awayTeam}
            </Text>
            <Text style={styles.recentDate}>{fmtDate(item.matchDate)}</Text>
          </View>
          <View style={styles.recentRight}>
            <View style={styles.pickBadgeRow}>
              <View style={[styles.pickBadge, { backgroundColor: RESULT_COLOR[item.prediction] }]}>
                <Text style={styles.pickBadgeText}>{PICK_LABELS[item.prediction]}</Text>
              </View>
            </View>
            <Text style={[styles.outcomeText, { color: item.isCorrect ? '#22c55e' : '#ef4444' }]}>
              {item.isCorrect ? t.statsWin : t.statsLoss}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a1628', paddingHorizontal: 16, paddingTop: 14 },
  center:     { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 12 },

  // Ring chart
  ringRow:    { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 8 },
  ringCenter: { alignItems: 'center' },
  ringCorrect:{ color: '#22c55e', fontSize: 22, fontWeight: '800' },
  ringDivider:{ width: 24, height: 2, backgroundColor: '#444', marginVertical: 3 },
  ringWrong:  { color: '#ef4444', fontSize: 22, fontWeight: '800' },
  ringLegend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot:  { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: '#888', fontSize: 13 },
  legendVal:  { color: '#fff', fontWeight: '700' },
  pctLabel:   { color: '#4a9eff', fontSize: 22, fontWeight: '800' },

  // Streaks
  streakRow:  { flexDirection: 'row', gap: 12, marginBottom: 8 },
  streakCard: { flex: 1, backgroundColor: '#111e33', borderRadius: 10, padding: 16, alignItems: 'center' },
  streakNum:  { color: '#22c55e', fontSize: 32, fontWeight: '800' },
  streakLabel:{ color: '#888', fontSize: 12, marginTop: 4 },

  // Team accuracy
  teamRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  teamName:   { color: '#fff', fontSize: 13, width: 130 },
  teamBarTrack: { flex: 1, height: 8, backgroundColor: '#1a2a40', borderRadius: 4, overflow: 'hidden' },
  teamBarFill:  { height: 8, backgroundColor: '#22c55e', borderRadius: 4 },
  teamStat:   { color: '#888', fontSize: 12, width: 36, textAlign: 'right' },

  // Recent predictions
  recentCard: { borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardCorrect:{ backgroundColor: '#0f2e1a', borderLeftWidth: 4, borderLeftColor: '#22c55e' },
  cardWrong:  { backgroundColor: '#2e0f0f', borderLeftWidth: 4, borderLeftColor: '#ef4444' },
  recentLeft: { flex: 1 },
  recentTeams:{ color: '#fff', fontSize: 14, fontWeight: '600' },
  vs:         { color: '#666', fontWeight: '400' },
  recentDate: { color: '#555', fontSize: 11, marginTop: 3 },
  recentRight:{ alignItems: 'flex-end', gap: 6 },
  pickBadgeRow:{ flexDirection: 'row' },
  pickBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  pickBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  outcomeText:{ fontSize: 12, fontWeight: '700' },

  empty: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 20 },
});
