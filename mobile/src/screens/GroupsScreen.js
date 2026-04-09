import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, FlatList, Modal
} from 'react-native';
import { generateClient } from 'aws-amplify/api';
import { groupsByUsername, groupByJoinCode, membersByGroup } from '../graphql/queries';
import { createGroup, createGroupMember } from '../graphql/mutations';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';

const client = generateClient();

export default function GroupsScreen({ onSelectGroup }) {
  const { user, isAdmin } = useAuth();
  const { t } = useLang();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newJoinCode, setNewJoinCode] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.graphql({
        query: groupsByUsername,
        variables: { username: user.username, limit: 20 },
      });
      const memberships = res.data.groupsByUsername.items;

      const groups = await Promise.all(
        memberships.map(async (m) => {
          try {
            const gRes = await client.graphql({
              query: /* GraphQL */ `query GetGroup($id: ID!) { getGroup(id: $id) { id name joinCode } }`,
              variables: { id: m.groupId },
            });
            const g = gRes.data.getGroup;
            if (!g) return null;
            const mRes = await client.graphql({
              query: membersByGroup,
              variables: { groupId: m.groupId, limit: 100 },
            });
            return { ...g, membershipId: m.id, memberCount: mRes.data.membersByGroup.items.length };
          } catch { return null; }
        })
      );
      setMyGroups(groups.filter(Boolean));
    } catch (err) {
      Alert.alert(t.errorTitle, t.failedGroups + ' ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [user.username, t]);

  useEffect(() => { load(); }, [load]);

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 5) { Alert.alert(t.errorTitle, t.codeMust5); return; }
    setJoinLoading(true);
    try {
      const res = await client.graphql({ query: groupByJoinCode, variables: { joinCode: code, limit: 1 } });
      const found = res.data.groupByJoinCode.items[0];
      if (!found) { Alert.alert(t.notFound, t.noGroupCode); return; }
      if (myGroups.find(g => g.id === found.id)) { Alert.alert(t.alreadyJoined, t.alreadyInGroup); return; }
      await client.graphql({ query: createGroupMember, variables: { input: { groupId: found.id, username: user.username } } });
      setShowJoin(false);
      setJoinCode('');
      Alert.alert(t.joined, t.joinedMsg(found.name));
      load();
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setJoinLoading(false);
    }
  }

  async function handleCreate() {
    const name = newGroupName.trim();
    const code = newJoinCode.trim().toUpperCase();
    if (!name) { Alert.alert(t.errorTitle, t.groupNameRequired); return; }
    if (code.length !== 5) { Alert.alert(t.errorTitle, t.codeMust5); return; }
    if (!/^[A-Z0-9]{5}$/.test(code)) { Alert.alert(t.errorTitle, t.codeLettersOnly); return; }
    setCreateLoading(true);
    try {
      const check = await client.graphql({ query: groupByJoinCode, variables: { joinCode: code, limit: 1 } });
      if (check.data.groupByJoinCode.items.length > 0) { Alert.alert(t.codeTaken, t.codeTakenMsg); return; }
      const gRes = await client.graphql({ query: createGroup, variables: { input: { name, joinCode: code, createdBy: user.username } } });
      const newGroup = gRes.data.createGroup;
      await client.graphql({ query: createGroupMember, variables: { input: { groupId: newGroup.id, username: user.username } } });
      setShowCreate(false);
      setNewGroupName('');
      setNewJoinCode('');
      Alert.alert('✓', t.createdMsg(name, code));
      load();
    } catch (err) {
      Alert.alert(t.errorTitle, err.message || String(err));
    } finally {
      setCreateLoading(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#fff" size="large" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t.yourGroups}</Text>

      {myGroups.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t.noGroupsYet}</Text>
          <Text style={styles.emptySubText}>{t.joinToSee}</Text>
        </View>
      ) : (
        <FlatList
          data={myGroups}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.groupCard} onPress={() => onSelectGroup(item)}>
              <View>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupMeta}>
                  {t.code}: <Text style={styles.code}>{item.joinCode}</Text>
                  {'  ·  '}{item.memberCount} {item.memberCount !== 1 ? t.members : t.member}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
          <Text style={styles.joinBtnText}>{t.joinGroup}</Text>
        </TouchableOpacity>
        {isAdmin && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>{t.createGroup}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Join modal */}
      <Modal visible={showJoin} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.joinAGroup}</Text>
            <Text style={styles.modalLabel}>{t.enter5Code}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. AB12C"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={5}
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <TouchableOpacity style={[styles.modalBtn, joinLoading && { opacity: 0.6 }]} onPress={handleJoin} disabled={joinLoading}>
              <Text style={styles.modalBtnText}>{joinLoading ? t.joining : t.join}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowJoin(false); setJoinCode(''); }}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t.createGroupTitle}</Text>
            <Text style={styles.modalLabel}>{t.groupName}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Los Amigos"
              placeholderTextColor="#666"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <Text style={styles.modalLabel}>{t.joinCode}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. GOAT5"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={5}
              value={newJoinCode}
              onChangeText={setNewJoinCode}
            />
            <TouchableOpacity style={[styles.modalBtn, createLoading && { opacity: 0.6 }]} onPress={handleCreate} disabled={createLoading}>
              <Text style={styles.modalBtnText}>{createLoading ? t.creating : t.create}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowCreate(false); setNewGroupName(''); setNewJoinCode(''); }}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a1628', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyText: { color: '#aaa', fontSize: 16, marginBottom: 6 },
  emptySubText: { color: '#555', fontSize: 13 },
  groupCard: { backgroundColor: '#111e33', borderRadius: 10, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  groupMeta: { color: '#888', fontSize: 13 },
  code: { color: '#4a9eff', fontWeight: '700' },
  arrow: { color: '#555', fontSize: 22 },
  actions: { gap: 10, marginTop: 8 },
  joinBtn: { backgroundColor: '#006847', padding: 14, borderRadius: 8, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  createBtn: { backgroundColor: '#1a2a40', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2a3a50' },
  createBtnText: { color: '#4a9eff', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  modal: { backgroundColor: '#111e33', borderRadius: 14, padding: 24, width: '85%' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalLabel: { color: '#888', fontSize: 13, marginBottom: 6 },
  modalInput: { backgroundColor: '#0a1628', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: '#2a3a50' },
  modalBtn: { backgroundColor: '#006847', padding: 13, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cancelText: { color: '#888', textAlign: 'center', fontSize: 14 },
});
