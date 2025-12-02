import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { Player } from '../types';
import { StorageService } from '../utils/storage';

const PlayerSelectionScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { groupId, groupName } = route.params || {};

    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerAlias, setNewPlayerAlias] = useState('');

    useEffect(() => {
        loadPlayers();
    }, [groupId]);

    const loadPlayers = async () => {
        const storedPlayers = await StorageService.getPlayers();
        setAllPlayers(storedPlayers);

        if (groupId) {
            const groups = await StorageService.getGroups();
            const currentGroup = groups.find(g => g.id === groupId);
            if (currentGroup) {
                const groupPlayers = storedPlayers.filter(p => currentGroup.playerIds.includes(p.id));
                setFilteredPlayers(groupPlayers);
            } else {
                setFilteredPlayers(storedPlayers);
            }
        } else {
            setFilteredPlayers(storedPlayers);
        }
    };

    const handleAddPlayer = async () => {
        if (!newPlayerName.trim()) {
            Alert.alert('Error', 'Player name is required');
            return;
        }

        const newPlayer: Player = {
            id: Date.now().toString(),
            name: newPlayerName.trim(),
            alias: newPlayerAlias.trim() || undefined,
        };

        await StorageService.addPlayer(newPlayer);

        if (groupId) {
            await StorageService.addPlayerToGroup(groupId, newPlayer.id);
        }

        await loadPlayers();
        setNewPlayerName('');
        setNewPlayerAlias('');
        setModalVisible(false);
        setSelectedPlayers(prev => [...prev, newPlayer]);
    };

    const toggleSelection = (player: Player) => {
        if (selectedPlayers.find(p => p.id === player.id)) {
            setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));
        } else {
            setSelectedPlayers(prev => [...prev, player]);
        }
    };

    const handleAddToGroup = async (player: Player) => {
        if (groupId) {
            await StorageService.addPlayerToGroup(groupId, player.id);
            await loadPlayers();
            toggleSelection(player);
        } else {
            toggleSelection(player);
        }
    };

    const handleNext = () => {
        if (selectedPlayers.length < 2) {
            Alert.alert('Error', 'Please select at least 2 players');
            return;
        }
        navigation.navigate('GameConfig', { players: selectedPlayers, gameType: route.params?.gameType });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{groupName ? `${groupName} Players` : 'Game Players'}</Text>
                </View>
                <Text style={styles.headerSubtitle}>Drag to reorder • {selectedPlayers.length} selected</Text>
            </View>

            <View style={styles.listContainer}>
                {selectedPlayers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>No players selected.</Text>
                        <Text style={styles.emptyStateSubText}>Tap "+" to add players.</Text>
                    </View>
                ) : (
                    <DraggableFlatList
                        data={selectedPlayers}
                        onDragEnd={({ data }) => setSelectedPlayers(data)}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, drag, isActive }) => (
                            <ScaleDecorator>
                                <TouchableOpacity
                                    onLongPress={drag}
                                    style={[styles.item, isActive && styles.itemActive]}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.dragHandle}>☰</Text>
                                    <View style={styles.playerInfo}>
                                        <Text style={styles.itemText}>{item.name}</Text>
                                        {item.alias && <Text style={styles.itemSubText}>{item.alias}</Text>}
                                    </View>
                                    <TouchableOpacity onPress={() => toggleSelection(item)} style={styles.removeBtn}>
                                        <Text style={styles.removeBtnText}>✕</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            </ScaleDecorator>
                        )}
                    />
                )}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setModalVisible(true)}
                >
                    <Text style={styles.addButtonText}>+ Add / Select Players</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.nextButton, selectedPlayers.length < 2 && styles.disabledButton]}
                    onPress={handleNext}
                    disabled={selectedPlayers.length < 2}
                >
                    <Text style={styles.nextButtonText}>Next: Setup</Text>
                </TouchableOpacity>
            </View>

            {/* Modal for Selecting/Creating Players */}
            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Players</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Create New Player Form */}
                    <View style={styles.createForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Player Name"
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            placeholderTextColor={COLORS.textSecondary}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Alias (Optional)"
                            value={newPlayerAlias}
                            onChangeText={setNewPlayerAlias}
                            placeholderTextColor={COLORS.textSecondary}
                        />
                        <TouchableOpacity style={styles.createButton} onPress={handleAddPlayer}>
                            <Text style={styles.createButtonText}>Create & Add to Group</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeader}>{groupId ? `Players in ${groupName}` : 'All Players'}</Text>
                    <DraggableFlatList
                        data={filteredPlayers}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => {
                            const isSelected = selectedPlayers.find(p => p.id === item.id);
                            return (
                                <Animated.View entering={FadeInDown.duration(400)}>
                                    <TouchableOpacity
                                        style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                                        onPress={() => toggleSelection(item)}
                                    >
                                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                                            {item.name}
                                        </Text>
                                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }}
                        onDragEnd={() => { }}
                        ListFooterComponent={
                            groupId ? (
                                <View style={{ marginTop: SPACING.l }}>
                                    <Text style={styles.sectionHeader}>Other Players (Tap to Add to Group)</Text>
                                    {allPlayers.filter(p => !filteredPlayers.find(fp => fp.id === p.id)).map(player => (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={styles.modalItem}
                                            onPress={() => handleAddToGroup(player)}
                                        >
                                            <Text style={styles.modalItemText}>{player.name}</Text>
                                            <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>+ Add</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : null
                        }
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.l, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
    backButton: { marginRight: SPACING.m, padding: SPACING.xs },
    backButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' },
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
    headerSubtitle: { color: COLORS.textSecondary, fontSize: FONT_SIZE.s, marginLeft: 36 }, // Indent to align with title

    listContainer: { flex: 1 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyStateText: { fontSize: FONT_SIZE.l, color: COLORS.textSecondary, fontWeight: '600' },
    emptyStateSubText: { fontSize: FONT_SIZE.m, color: COLORS.textSecondary, marginTop: SPACING.s },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        backgroundColor: COLORS.card,
        marginHorizontal: SPACING.m,
        marginTop: SPACING.s,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    itemActive: { backgroundColor: '#E3F2FD', transform: [{ scale: 1.02 }], ...SHADOWS.medium },
    dragHandle: { fontSize: 24, color: COLORS.textSecondary, marginRight: SPACING.m },
    playerInfo: { flex: 1 },
    itemText: { fontSize: FONT_SIZE.m, fontWeight: '600', color: COLORS.text },
    itemSubText: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary },
    removeBtn: { padding: SPACING.s },
    removeBtnText: { fontSize: 18, color: COLORS.danger },

    footer: { padding: SPACING.l, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
    addButton: { padding: SPACING.m, backgroundColor: COLORS.background, borderRadius: 12, alignItems: 'center', marginBottom: SPACING.m, borderWidth: 1, borderColor: COLORS.primary, borderStyle: 'dashed' },
    addButtonText: { color: COLORS.primary, fontSize: FONT_SIZE.m, fontWeight: '600' },
    nextButton: { padding: SPACING.m, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', ...SHADOWS.small },
    nextButtonText: { color: COLORS.white, fontSize: FONT_SIZE.l, fontWeight: 'bold' },
    disabledButton: { backgroundColor: COLORS.textSecondary, opacity: 0.5 },

    modalContainer: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.l },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
    closeText: { fontSize: FONT_SIZE.m, color: COLORS.primary, fontWeight: '600' },
    createForm: { backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: 16, marginBottom: SPACING.l, ...SHADOWS.small },
    input: { borderWidth: 1, borderColor: COLORS.border, padding: SPACING.m, borderRadius: 10, marginBottom: SPACING.m, fontSize: FONT_SIZE.m, color: COLORS.text },
    createButton: { backgroundColor: COLORS.success, padding: SPACING.m, borderRadius: 10, alignItems: 'center' },
    createButtonText: { color: COLORS.white, fontWeight: '600', fontSize: FONT_SIZE.m },
    sectionHeader: { fontSize: FONT_SIZE.m, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.s, marginLeft: SPACING.xs },
    modalItem: { padding: SPACING.m, backgroundColor: COLORS.card, borderRadius: 12, marginBottom: SPACING.s, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.small },
    modalItemSelected: { backgroundColor: '#E3F2FD', borderColor: COLORS.primary, borderWidth: 1 },
    modalItemText: { fontSize: FONT_SIZE.m, color: COLORS.text },
    modalItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
    checkmark: { color: COLORS.primary, fontSize: FONT_SIZE.l, fontWeight: 'bold' },
});

export default PlayerSelectionScreen;
