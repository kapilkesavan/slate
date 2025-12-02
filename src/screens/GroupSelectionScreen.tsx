import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { PlayerGroup } from '../types';
import { StorageService } from '../utils/storage';

const GroupSelectionScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { gameType } = route.params || { gameType: 'RUMMY' }; // Default to Rummy if not provided

    const [groups, setGroups] = useState<PlayerGroup[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        const loadedGroups = await StorageService.getGroups();
        setGroups(loadedGroups);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        const newGroup: PlayerGroup = {
            id: Date.now().toString(),
            name: newGroupName.trim(),
            playerIds: []
        };

        await StorageService.saveGroup(newGroup);
        setNewGroupName('');
        setModalVisible(false);
        loadGroups();
    };

    const handleDeleteGroup = (group: PlayerGroup) => {
        Alert.alert(
            'Delete Group',
            `Are you sure you want to delete "${group.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await StorageService.deleteGroup(group.id);
                        loadGroups();
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }: { item: PlayerGroup; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('PlayerSelection', { groupId: item.id, groupName: item.name, gameType })}
                onLongPress={() => handleDeleteGroup(item)}
            >
                <View style={styles.cardContent}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.playerCount}>{item.playerIds.length} Players</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Group</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={groups}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No groups found. Create one to get started!</Text>
                    </View>
                }
            />

            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.footer}>
                <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.createButtonText}>+ Create New Group</Text>
                </TouchableOpacity>
            </Animated.View>

            <Modal visible={isModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>New Group</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Group Name (e.g. Family, Office)"
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleCreateGroup}>
                                <Text style={styles.saveButtonText}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backButton: { padding: SPACING.s },
    backButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' },
    headerTitle: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.text },

    listContent: { padding: SPACING.m, paddingBottom: 100 },

    card: { backgroundColor: COLORS.card, borderRadius: 12, padding: SPACING.l, marginBottom: SPACING.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.small },
    cardContent: { flex: 1 },
    groupName: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    playerCount: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary },
    arrow: { fontSize: FONT_SIZE.xl, color: COLORS.textSecondary, fontWeight: 'bold' },

    emptyState: { alignItems: 'center', marginTop: SPACING.xxl },
    emptyText: { fontSize: FONT_SIZE.m, color: COLORS.textSecondary, textAlign: 'center' },

    footer: { position: 'absolute', bottom: 30, left: SPACING.l, right: SPACING.l },
    createButton: { backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: 16, alignItems: 'center', ...SHADOWS.medium },
    createButtonText: { color: COLORS.white, fontSize: FONT_SIZE.l, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.l },
    modalContainer: { backgroundColor: COLORS.background, borderRadius: 16, padding: SPACING.l, ...SHADOWS.medium },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', marginBottom: SPACING.l, textAlign: 'center' },
    input: { backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: 8, fontSize: FONT_SIZE.m, marginBottom: SPACING.l, borderWidth: 1, borderColor: COLORS.border },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
    modalButton: { flex: 1, padding: SPACING.m, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: COLORS.card, marginRight: SPACING.s },
    cancelButtonText: { color: COLORS.text, fontWeight: 'bold' },
    saveButton: { backgroundColor: COLORS.primary, marginLeft: SPACING.s },
    saveButtonText: { color: COLORS.white, fontWeight: 'bold' },
});

export default GroupSelectionScreen;
