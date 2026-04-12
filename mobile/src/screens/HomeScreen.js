import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import MyPicksScreen from './MyPicksScreen';
import WeeklyGridScreen from './WeeklyGridScreen';
import GroupsScreen from './GroupsScreen';
import LeaderboardScreen from './LeaderboardScreen';
import AdminScreen from './AdminScreen';
import { groupsByUsername } from '../graphql/queries';

const client = generateClient();

const GET_GROUP = /* GraphQL */ `
  query GetGroup($id: ID!) { getGroup(id: $id) { id name joinCode } }
`;

export default function HomeScreen() {
  const { logout, isAdmin, user } = useAuth();
  const { t } = useLang();
  const [tab, setTab] = useState('picks');
  const [activeGroup, setActiveGroup] = useState(null);

  // On login, auto-load the user's group from the server (works across devices)
  useEffect(() => {
    if (!user?.username) return;
    async function autoLoadGroup() {
      try {
        const res = await client.graphql({
          query: groupsByUsername,
          variables: { username: user.username, limit: 1 },
        });
        const memberships = res.data.groupsByUsername.items;
        if (!memberships.length) return;
        const gRes = await client.graphql({
          query: GET_GROUP,
          variables: { id: memberships[0].groupId },
        });
        const group = gRes.data.getGroup;
        if (group) setActiveGroup(group);
      } catch (e) {
        console.log('Could not auto-load group', e);
      }
    }
    autoLoadGroup();
  }, [user?.username]);

  const TABS = [
    { key: 'picks', label: t.myPicks },
    { key: 'grid', label: t.grid },
    { key: 'standings', label: t.standings },
    { key: 'groups', label: t.groups },
    ...(isAdmin ? [{ key: 'admin', label: 'Admin' }] : []),
  ];

  function handleSelectGroup(group) {
    setActiveGroup(group);
    setTab('grid');
  }

  function NoGroupPrompt() {
    return (
      <View style={styles.noGroup}>
        <Text style={styles.noGroupText}>{t.noGroupSelected}</Text>
        <TouchableOpacity onPress={() => setTab('groups')}>
          <Text style={styles.noGroupLink}>{t.goToGroups}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderContent() {
    switch (tab) {
      case 'picks': return <MyPicksScreen />;
      case 'grid': return activeGroup ? <WeeklyGridScreen group={activeGroup} /> : <NoGroupPrompt />;
      case 'standings': return activeGroup ? <LeaderboardScreen group={activeGroup} /> : <NoGroupPrompt />;
      case 'groups': return <GroupsScreen onSelectGroup={handleSelectGroup} />;
      case 'admin': return <AdminScreen />;
      default: return null;
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.appName}>{t.appName}</Text>
          {activeGroup && (tab === 'grid' || tab === 'standings') && (
            <Text style={styles.groupPill}>{activeGroup.name}</Text>
          )}
        </View>
        <View style={styles.topRight}>
          <LangToggle />
          <TouchableOpacity onPress={logout}>
            <Text style={styles.signOut}>{t.signOut}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#0a1628',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a40',
  },
  appName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  groupPill: { color: '#4a9eff', fontSize: 12, marginTop: 2 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOut: { color: '#888', fontSize: 14 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a1628',
    borderBottomWidth: 1,
    borderBottomColor: '#1a2a40',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#006847' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1 },
  noGroup: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noGroupText: { color: '#888', fontSize: 15, marginBottom: 12 },
  noGroupLink: { color: '#4a9eff', fontSize: 15 },
});
