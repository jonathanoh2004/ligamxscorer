import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LangToggle from '../components/LangToggle';
import MyPicksScreen from './MyPicksScreen';
import WeeklyGridScreen from './WeeklyGridScreen';
import StatsScreen from './StatsScreen';
import AdminScreen from './AdminScreen';
import {
  groupsByUsername, groupByJoinCode,
} from '../graphql/queries';
import {
  createGroup, createGroupMember, updateGroupMember, deleteGroupMember,
} from '../graphql/mutations';

const client = generateClient();

const GET_GROUP = /* GraphQL */ `
  query GetGroup($id: ID!) { getGroup(id: $id) { id name joinCode } }
`;

export default function HomeScreen() {
  const { logout, isAdmin, user } = useAuth();
  const { t } = useLang();

  const [tab, setTab] = useState('picks');

  // Group state
  const [activeGroup, setActiveGroup]   = useState(null);
  const [membershipId, setMembershipId] = useState(null);
  const [displayName, setDisplayName]   = useState('');
  const [groupLoading, setGroupLoading] = useState(true);

  // Gate (join/create flow)
  const [gateView, setGateView]         = useState('main'); // 'main'|'join'|'create'
  const [joinCode, setJoinCode]         = useState('');
  const [joinLoading, setJoinLoading]   = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newJoinCode, setNewJoinCode]   = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Settings modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingName, setEditingName]         = useState('');
  const [savingName, setSavingName]           = useState(false);
  const [leavingGroup, setLeavingGroup]       = useState(false);

  useEffect(() => {
    if (!user?.username) return;
    loadGroup();
  }, [user?.username]);

  async function loadGroup() {
    setGroupLoading(true);
    try {
      const res = await client.graphql({
        query: groupsByUsername,
        variables: { username: user.username, limit: 1 },
      });
      const memberships = res.data.groupsByUsername.items;
      if (!memberships.length) return;
      const m = memberships[0];
      setMembershipId(m.id);
      const dn = m.displayName || user.username;
      setDisplayName(dn);
      setEditingName(dn);
      const gRes = await client.graphql({ query: GET_GROUP, variables: { id: m.groupId } });
      const group = gRes.data.getGroup;
      if (group) setActiveGroup(group);
    } catch (e) {
      console.log('Could not load group', e);
    } finally {
      setGroupLoading(false);
    }
  }

  // ── Gate: join ──────────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 5) { Alert.alert(t.errorTitle, t.codeMust5); return; }
    setJoinLoading(true);
    try {
      const res = await client.graphql({
        query: groupByJoinCode,
        variables: { joinCode: code, limit: 1 },
      });
      const found = res.data.groupByJoinCode.items[0];
      if (!found) { Alert.alert(t.notFound, t.noGroupCode); return; }
      const memRes = await client.graphql({
        query: createGroupMember,
        variables: { input: { groupId: found.id, username: user.username, displayName: user.username } },
      });
      setMembershipId(memRes.data.createGroupMember.id);
      setDisplayName(user.username);
      setEditingName(user.username);
      setActiveGroup(found);
      setJoinCode('');
      setGateView('main');
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setJoinLoading(false);
    }
  }

  // ── Gate: create (admin only) ───────────────────────────────────────────────
  async function handleCreate() {
    const name = newGroupName.trim();
    const code = newJoinCode.trim().toUpperCase();
    if (!name) { Alert.alert(t.errorTitle, t.groupNameRequired); return; }
    if (code.length !== 5) { Alert.alert(t.errorTitle, t.codeMust5); return; }
    if (!/^[A-Z0-9]{5}$/.test(code)) { Alert.alert(t.errorTitle, t.codeLettersOnly); return; }
    setCreateLoading(true);
    try {
      const check = await client.graphql({
        query: groupByJoinCode,
        variables: { joinCode: code, limit: 1 },
      });
      if (check.data.groupByJoinCode.items.length > 0) {
        Alert.alert(t.codeTaken, t.codeTakenMsg);
        return;
      }
      const gRes = await client.graphql({
        query: createGroup,
        variables: { input: { name, joinCode: code, createdBy: user.username } },
      });
      const newGroup = gRes.data.createGroup;
      const memRes = await client.graphql({
        query: createGroupMember,
        variables: { input: { groupId: newGroup.id, username: user.username, displayName: user.username } },
      });
      setMembershipId(memRes.data.createGroupMember.id);
      setDisplayName(user.username);
      setEditingName(user.username);
      setActiveGroup(newGroup);
      setNewGroupName('');
      setNewJoinCode('');
      setGateView('main');
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setCreateLoading(false);
    }
  }

  // ── Settings: save display name ─────────────────────────────────────────────
  async function handleSaveName() {
    const name = editingName.trim();
    if (!name || !membershipId) return;
    setSavingName(true);
    try {
      await client.graphql({
        query: updateGroupMember,
        variables: { input: { id: membershipId, displayName: name } },
      });
      setDisplayName(name);
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setSavingName(false);
    }
  }

  // ── Settings: leave group ───────────────────────────────────────────────────
  function confirmLeave() {
    Alert.alert(t.leaveGroup, t.leaveGroupConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.leave, style: 'destructive', onPress: doLeaveGroup },
    ]);
  }

  async function doLeaveGroup() {
    if (!membershipId) return;
    setLeavingGroup(true);
    try {
      await client.graphql({
        query: deleteGroupMember,
        variables: { input: { id: membershipId } },
      });
      setActiveGroup(null);
      setMembershipId(null);
      setDisplayName('');
      setSettingsVisible(false);
      setGateView('main');
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setLeavingGroup(false);
    }
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS = [
    { key: 'picks', label: t.myPicks },
    { key: 'grid', label: t.grid },
    { key: 'standings', label: t.standings },
    ...(isAdmin ? [{ key: 'admin', label: 'Admin' }] : []),
  ];

  function renderContent() {
    switch (tab) {
      case 'picks':    return <MyPicksScreen />;
      case 'grid':     return <WeeklyGridScreen group={activeGroup} />;
      case 'standings':return <StatsScreen />;
      case 'admin':    return <AdminScreen />;
      default:         return null;
    }
  }

  // ── Loading (group fetch in progress) ──────────────────────────────────────
  if (groupLoading) {
    return (
      <View style={styles.container}>
        <TopBar t={t} onSettings={() => {}} />
        <View style={styles.loadingContent}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      </View>
    );
  }

  // ── Group gate (no group yet) ───────────────────────────────────────────────
  if (!activeGroup) {
    return (
      <View style={styles.container}>
        <TopBar t={t} onSettings={() => {}} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.gateWrap} keyboardShouldPersistTaps="handled">
            {gateView === 'main' && (
              <GateMain
                t={t} isAdmin={isAdmin}
                onJoin={() => setGateView('join')}
                onCreate={() => setGateView('create')}
              />
            )}
            {gateView === 'join' && (
              <GateJoin
                t={t}
                joinCode={joinCode} setJoinCode={setJoinCode}
                joinLoading={joinLoading} onJoin={handleJoin}
                onBack={() => { setGateView('main'); setJoinCode(''); }}
              />
            )}
            {gateView === 'create' && (
              <GateCreate
                t={t}
                newGroupName={newGroupName} setNewGroupName={setNewGroupName}
                newJoinCode={newJoinCode} setNewJoinCode={setNewJoinCode}
                createLoading={createLoading} onCreate={handleCreate}
                onBack={() => { setGateView('main'); setNewGroupName(''); setNewJoinCode(''); }}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Main app ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <TopBar
        t={t}
        activeGroup={activeGroup}
        showGroupPill={tab === 'grid'}
        onSettings={() => { setEditingName(displayName); setSettingsVisible(true); }}
      />

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

      {/* Settings modal */}
      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.settingsPanel}>
            {/* Header */}
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t.settingsTitle}</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Group info */}
            <Text style={styles.settingsLabel}>{t.yourGroupLabel}</Text>
            <View style={styles.groupInfoRow}>
              <Text style={styles.groupInfoName}>{activeGroup.name}</Text>
              <Text style={styles.groupInfoCode}>{activeGroup.joinCode}</Text>
            </View>

            {/* Display name */}
            <Text style={[styles.settingsLabel, { marginTop: 20 }]}>{t.nameInGroup}</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                value={editingName}
                onChangeText={setEditingName}
                placeholder={user.username}
                placeholderTextColor="#555"
                maxLength={20}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.saveBtn, (savingName || editingName.trim() === displayName) && { opacity: 0.5 }]}
                onPress={handleSaveName}
                disabled={savingName || editingName.trim() === displayName || !editingName.trim()}
              >
                {savingName
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{t.save}</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Leave group */}
            <TouchableOpacity
              style={[styles.leaveBtn, leavingGroup && { opacity: 0.5 }]}
              onPress={confirmLeave}
              disabled={leavingGroup}
            >
              {leavingGroup
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.leaveBtnText}>{t.leaveGroup}</Text>
              }
            </TouchableOpacity>

            {/* Sign out */}
            <TouchableOpacity style={styles.signOutRow} onPress={logout}>
              <Text style={styles.signOutText}>{t.signOut}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopBar({ t, activeGroup, showGroupPill, onSettings }) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.appName}>{t.appName}</Text>
        {activeGroup && showGroupPill && (
          <Text style={styles.groupPill}>{activeGroup.name}</Text>
        )}
      </View>
      <View style={styles.topRight}>
        <LangToggle />
        <TouchableOpacity onPress={onSettings} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GateMain({ t, isAdmin, onJoin, onCreate }) {
  return (
    <View style={styles.gateContent}>
      <Text style={styles.gateTitle}>{t.welcomeTitle}</Text>
      <Text style={styles.gateSub}>{t.welcomeSub}</Text>
      <TouchableOpacity style={styles.joinBtn} onPress={onJoin}>
        <Text style={styles.joinBtnText}>{t.joinGroupBtn}</Text>
      </TouchableOpacity>
      {isAdmin && (
        <>
          <Text style={styles.orText}>{t.orCreate}</Text>
          <TouchableOpacity style={styles.createBtn} onPress={onCreate}>
            <Text style={styles.createBtnText}>{t.createGroup}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function GateJoin({ t, joinCode, setJoinCode, joinLoading, onJoin, onBack }) {
  return (
    <View style={styles.gateContent}>
      <Text style={styles.gateTitle}>{t.joinAGroup}</Text>
      <Text style={styles.gateLabel}>{t.enter5Code}</Text>
      <TextInput
        style={styles.gateInput}
        placeholder="e.g. AB12C"
        placeholderTextColor="#555"
        autoCapitalize="characters"
        maxLength={5}
        value={joinCode}
        onChangeText={setJoinCode}
      />
      <TouchableOpacity
        style={[styles.joinBtn, joinLoading && { opacity: 0.6 }]}
        onPress={onJoin}
        disabled={joinLoading}
      >
        {joinLoading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.joinBtnText}>{t.join}</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
        <Text style={styles.backText}>{t.backBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

function GateCreate({ t, newGroupName, setNewGroupName, newJoinCode, setNewJoinCode, createLoading, onCreate, onBack }) {
  return (
    <View style={styles.gateContent}>
      <Text style={styles.gateTitle}>{t.createGroupTitle}</Text>
      <Text style={styles.gateLabel}>{t.groupName}</Text>
      <TextInput
        style={styles.gateInput}
        placeholder="e.g. Los Amigos"
        placeholderTextColor="#555"
        value={newGroupName}
        onChangeText={setNewGroupName}
      />
      <Text style={styles.gateLabel}>{t.joinCodeLabel}</Text>
      <TextInput
        style={styles.gateInput}
        placeholder="e.g. GOAT5"
        placeholderTextColor="#555"
        autoCapitalize="characters"
        maxLength={5}
        value={newJoinCode}
        onChangeText={setNewJoinCode}
      />
      <TouchableOpacity
        style={[styles.joinBtn, createLoading && { opacity: 0.6 }]}
        onPress={onCreate}
        disabled={createLoading}
      >
        {createLoading
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.joinBtnText}>{t.create}</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
        <Text style={styles.backText}>{t.backBtn}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  loadingContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#0a1628', borderBottomWidth: 1, borderBottomColor: '#1a2a40',
  },
  appName:    { color: '#fff', fontSize: 18, fontWeight: '700' },
  groupPill:  { color: '#4a9eff', fontSize: 12, marginTop: 2 },
  topRight:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsBtn:{ padding: 4 },
  settingsIcon: { color: '#888', fontSize: 20 },

  // Tabs
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0a1628',
    borderBottomWidth: 1, borderBottomColor: '#1a2a40',
  },
  tab:           { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: '#006847' },
  tabText:       { color: '#888', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  content:       { flex: 1 },

  // Gate
  gateWrap:    { flexGrow: 1, justifyContent: 'center', padding: 24 },
  gateContent: { alignItems: 'center' },
  gateTitle:   { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  gateSub:     { color: '#888', fontSize: 15, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  gateLabel:   { color: '#888', fontSize: 13, alignSelf: 'flex-start', marginBottom: 6, width: '100%' },
  gateInput: {
    backgroundColor: '#111e33', color: '#fff', padding: 14, borderRadius: 10,
    fontSize: 18, marginBottom: 16, borderWidth: 1, borderColor: '#2a3a50',
    width: '100%', letterSpacing: 4, textAlign: 'center',
  },
  joinBtn:      { backgroundColor: '#006847', padding: 16, borderRadius: 10, alignItems: 'center', width: '100%', marginBottom: 4 },
  joinBtnText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
  orText:       { color: '#444', fontSize: 13, marginVertical: 12 },
  createBtn:    { backgroundColor: '#111e33', padding: 14, borderRadius: 10, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#2a3a50' },
  createBtnText:{ color: '#4a9eff', fontSize: 15, fontWeight: '600' },
  backText:     { color: '#555', fontSize: 14 },

  // Settings modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  settingsPanel: {
    backgroundColor: '#111e33', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  settingsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  settingsTitle:   { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn:        { color: '#555', fontSize: 18, padding: 4 },
  settingsLabel:   { color: '#555', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  groupInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  groupInfoName:   { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  groupInfoCode:   { color: '#4a9eff', fontSize: 14, fontWeight: '700', backgroundColor: '#0a1628', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  nameRow:         { flexDirection: 'row', gap: 10, alignItems: 'center' },
  nameInput: {
    flex: 1, backgroundColor: '#0a1628', color: '#fff', padding: 12,
    borderRadius: 8, fontSize: 15, borderWidth: 1, borderColor: '#2a3a50',
  },
  saveBtn:         { backgroundColor: '#006847', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },
  leaveBtn:        { marginTop: 28, backgroundColor: '#3a1010', padding: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#6b1a1a' },
  leaveBtnText:    { color: '#ef4444', fontWeight: '700', fontSize: 15 },
  signOutRow:      { marginTop: 12, padding: 14, alignItems: 'center' },
  signOutText:     { color: '#555', fontSize: 15 },
});
