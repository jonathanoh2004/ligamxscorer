import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { matchesByWeek, predictionsByWeek, membersByGroup, scoresByWeek } from '../graphql/queries';
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

const CELL_COLORS    = { H: '#1a6b3a', D: '#3a3a5c', A: '#6b1a1a' };
const RESULT_COLORS  = { H: '#22c55e', D: '#6366f1', A: '#ef4444' };
const PICK_LABELS    = { en: { H: 'W', D: 'D', A: 'L' }, es: { H: 'G', D: 'E', A: 'P' } };

const COL_WIDTH       = 64;
const NAME_COL_WIDTH  = 120;
const PTS_COL_WIDTH   = 38;
const FROZEN_WIDTH    = NAME_COL_WIDTH + PTS_COL_WIDTH;
const HEADER_HEIGHT   = 76;
const ROW_HEIGHT      = 44;
const COLS_PER_PAGE   = 5;

export default function WeeklyGridScreen({ group }) {
  const { t, fmtDate, fmtWeek, lang } = useLang();
  const [matches, setMatches]       = useState([]);
  const [grid, setGrid]             = useState({});
  const [users, setUsers]           = useState([]);
  const [displayNames, setDisplayNames] = useState({});
  const [scores, setScores]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('paged'); // 'scroll' | 'paged'
  const weekId = getCurrentWeekId();

  const pickLabel = PICK_LABELS[lang] || PICK_LABELS.en;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const memberRes = await client.graphql({
        query: membersByGroup,
        variables: { groupId: group.id, limit: 100 },
      });
      const members = memberRes.data.membersByGroup.items;
      const groupUsernames = new Set(members.map(m => m.username));
      const dnMap = {};
      for (const m of members) dnMap[m.username] = m.displayName || m.username;

      const [matchRes, predRes, scoreRes] = await Promise.all([
        client.graphql({ query: matchesByWeek, variables: { weekId, limit: 20 } }),
        client.graphql({ query: predictionsByWeek, variables: { weekId, limit: 500 } }),
        client.graphql({ query: scoresByWeek, variables: { weekId, limit: 200 } }),
      ]);

      const fetchedMatches = matchRes.data.matchesByWeek.items
        .sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));

      const preds = predRes.data.predictionsByWeek.items.filter(p => groupUsernames.has(p.username));
      const gridMap = {};
      for (const p of preds) {
        if (!gridMap[p.username]) gridMap[p.username] = {};
        gridMap[p.username][p.matchId] = p.prediction;
      }

      const scoreMap = {};
      for (const s of scoreRes.data.scoresByWeek.items) {
        if (groupUsernames.has(s.username)) scoreMap[s.username] = s.score;
      }

      setMatches(fetchedMatches);
      setGrid(gridMap);
      setUsers(Array.from(groupUsernames).sort());
      setDisplayNames(dnMap);
      setScores(scoreMap);
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


  function renderCell(username, m) {
    const pick = grid[username]?.[m.matchId];
    const isCorrect = m.result && pick === m.result;
    const isWrong   = m.result && pick && pick !== m.result;
    return (
      <View
        key={m.matchId}
        style={[
          styles.cell,
          { width: COL_WIDTH },
          pick ? { backgroundColor: CELL_COLORS[pick] } : null,
          isCorrect && styles.cellCorrect,
          isWrong   && styles.cellWrong,
        ]}
      >
        <Text style={styles.cellText}>{pick ? pickLabel[pick] : '—'}</Text>
      </View>
    );
  }

  function renderMatchHeader(m) {
    return (
      <View key={m.matchId} style={[styles.headerCell, { width: COL_WIDTH }]}>
        <Text style={styles.headerHome} numberOfLines={1}>{m.homeTeam.split(' ')[0]}</Text>
        <Text style={styles.headerVs}>vs</Text>
        <Text style={styles.headerAway} numberOfLines={1}>{m.awayTeam.split(' ')[0]}</Text>
        <Text style={styles.headerDate}>{fmtDate(m.matchDate, t.colDateFormat)}</Text>
        {m.result ? (
          <View style={[styles.resultBadge, { backgroundColor: RESULT_COLORS[m.result] }]}>
            <Text style={styles.resultBadgeText}>{pickLabel[m.result]}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  // ── Paged grid: frozen [name + pts] columns + single shared horizontal scroll ──
  function renderPagedGrid() {
    return (
      <View style={styles.pagedGrid}>
        {/* Frozen columns: name + pts */}
        <View style={styles.frozenCol}>
          {/* Corner header */}
          <View style={{ height: HEADER_HEIGHT, flexDirection: 'row' }}>
            <View style={{ width: NAME_COL_WIDTH }} />
            <View style={[styles.ptsHeaderCell, { width: PTS_COL_WIDTH }]}>
              <Text style={styles.ptsHeaderText}>Pts</Text>
            </View>
          </View>
          {users.map(u => (
            <View key={u} style={{ flexDirection: 'row', height: ROW_HEIGHT, borderBottomWidth: 1, borderBottomColor: '#1a2a40' }}>
              <View style={[styles.userCell, { width: NAME_COL_WIDTH, height: ROW_HEIGHT, borderBottomWidth: 0 }]}>
                <Text style={styles.username} numberOfLines={1}>{displayNames[u] || u}</Text>
              </View>
              <View style={styles.ptsCell}>
                <Text style={styles.ptsText}>{scores[u] ?? 0}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scrollable match columns */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={COL_WIDTH * COLS_PER_PAGE}
          decelerationRate="fast"
          style={{ marginLeft: FROZEN_WIDTH }}
        >
          <View>
            <View style={{ flexDirection: 'row' }}>
              {matches.map(renderMatchHeader)}
            </View>
            {users.map(u => (
              <View key={u} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a2a40' }}>
                {matches.map(m => renderCell(u, m))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Scroll grid: full horizontal scroll with pts column after name ──
  function renderScrollGrid() {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.row}>
            <View style={{ width: NAME_COL_WIDTH, height: HEADER_HEIGHT }} />
            <View style={[styles.ptsHeaderCell, { width: PTS_COL_WIDTH, height: HEADER_HEIGHT }]}>
              <Text style={styles.ptsHeaderText}>Pts</Text>
            </View>
            {matches.map(renderMatchHeader)}
          </View>
          {users.map(u => (
            <View key={u} style={styles.row}>
              <View style={[styles.userCell, { width: NAME_COL_WIDTH }]}>
                <Text style={styles.username} numberOfLines={1}>{displayNames[u] || u}</Text>
              </View>
              <View style={styles.ptsCell}>
                <Text style={styles.ptsText}>{scores[u] ?? 0}</Text>
              </View>
              {matches.map(m => renderCell(u, m))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      {/* Header row: week label + view toggle */}
      <View style={styles.topRow}>
        <Text style={styles.weekLabel}>{fmtWeek(weekId)} · {group.name}</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'paged' && styles.modeBtnActive]}
            onPress={() => setViewMode('paged')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'paged' && styles.modeBtnTextActive]}>⊟</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'scroll' && styles.modeBtnActive]}
            onPress={() => setViewMode('scroll')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'scroll' && styles.modeBtnTextActive]}>⟺</Text>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'paged' ? renderPagedGrid() : renderScrollGrid()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0a1628', paddingTop: 12 },
  center:     { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  topRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginHorizontal: 12 },
  weekLabel:  { color: '#888', fontSize: 13 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#111e33', borderRadius: 6, padding: 2, gap: 2 },
  modeBtn:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  modeBtnActive: { backgroundColor: '#006847' },
  modeBtnText:   { color: '#555', fontSize: 14 },
  modeBtnTextActive: { color: '#fff' },
  // Paged grid
  pagedGrid:  { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  frozenCol:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: FROZEN_WIDTH, backgroundColor: '#0a1628', zIndex: 2 },
  ptsHeaderCell: { alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40' },
  ptsHeaderText: { color: '#555', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  ptsCell: { width: PTS_COL_WIDTH, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40' },
  ptsText: { color: '#f0a500', fontSize: 13, fontWeight: '700' },
  // Shared row/cell styles
  row:        { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  headerCell: { height: HEADER_HEIGHT, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40', padding: 4 },
  headerHome: { color: '#fff', fontSize: 10, fontWeight: '600', textAlign: 'center' },
  headerVs:   { color: '#555', fontSize: 9 },
  headerAway: { color: '#aaa', fontSize: 10, textAlign: 'center' },
  headerDate: { color: '#555', fontSize: 9, marginTop: 2 },
  resultBadge: { marginTop: 3, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  resultBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  userCell:   { height: ROW_HEIGHT, justifyContent: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  username:   { color: '#fff', fontSize: 13 },
  cell:       { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: '#1a2a40', backgroundColor: '#111e33' },
  cellCorrect: { borderWidth: 2, borderColor: '#22c55e' },
  cellWrong:  { opacity: 0.45 },
  cellText:   { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyText:  { color: '#888', fontSize: 15 },
  // Standings
  standingsTitle:  { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8, marginLeft: 12 },
  standingsHeader: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a2a40' },
  standingsRow:    { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' },
  rowAlt:     { backgroundColor: '#0d1a2d' },
  sCell:      { color: '#fff', fontSize: 14 },
  rankCol:    { width: 28, color: '#555', fontSize: 12, fontWeight: '700' },
  nameCol:    { flex: 1 },
  scoreCol:   { width: 50, textAlign: 'right' },
  scoreText:  { fontWeight: '700', fontSize: 16 },
  gold:       { color: '#f0a500' },
});
