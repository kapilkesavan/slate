import { useNavigation, useRoute } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { GameRound, GameSession, Player, RoundScore } from '../types';
import { ScoringService } from '../utils/scoring';
import { StorageService } from '../utils/storage';

const ScoreboardScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { sessionId, readOnly } = route.params || {};
    const viewRef = useRef<ScrollView>(null);

    const [session, setSession] = useState<GameSession | null>(null);
    const [totals, setTotals] = useState<Record<string, number>>({});
    const [potSize, setPotSize] = useState(0);
    const [rankings, setRankings] = useState<{ playerId: string; rank: number }[]>([]);

    // Modal State
    const [isScoreModalVisible, setScoreModalVisible] = useState(false);
    const [currentRoundScores, setCurrentRoundScores] = useState<Record<string, string>>({});

    // Edit Score State
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingScore, setEditingScore] = useState<{ roundId: string; playerId: string; currentScore: string } | null>(null);

    // Add Player State
    const [isAddPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');

    const handleShare = async () => {
        try {
            if (viewRef.current) {
                const uri = await captureRef(viewRef, {
                    format: 'png',
                    quality: 0.8,
                });
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Error', 'Could not capture view for sharing.');
            }
        } catch (error) {
            console.error('Error sharing scoreboard', error);
            Alert.alert('Error', 'Failed to share scoreboard.');
        }
    };

    const handleAddPlayer = async () => {
        if (!session || !newPlayerName.trim()) return;

        const currentTotals = ScoringService.calculateTotalScores(session);
        const activeScores = session.players
            .filter(p => !session.eliminatedPlayerIds.includes(p.id))
            .map(p => currentTotals[p.id]);

        const startScore = activeScores.length > 0 ? Math.max(...activeScores) : 0;

        Alert.alert(
            'Confirm Add Player',
            `Add "${newPlayerName}" with starting score: ${startScore}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add',
                    onPress: async () => {
                        const newPlayer: Player = {
                            id: Date.now().toString(),
                            name: newPlayerName.trim(),
                        };

                        const updatedSession = { ...session };
                        updatedSession.players.push(newPlayer);

                        // Add adjustment round for new player
                        const adjustmentRound: GameRound = {
                            id: `join-${Date.now()}`,
                            scores: [{ playerId: newPlayer.id, score: startScore }],
                            timestamp: Date.now(),
                        };

                        updatedSession.rounds.push(adjustmentRound);

                        await saveSession(updatedSession);
                        setAddPlayerModalVisible(false);
                        setNewPlayerName('');
                    }
                }
            ]
        );
    };

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    const loadSession = async () => {
        const current = await StorageService.getCurrentSession();
        if (current && current.id === sessionId) {
            setSession(current);
            updateStats(current);
        } else {
            const history = await StorageService.getGameHistory();
            const found = history.find(s => s.id === sessionId);
            if (found) {
                setSession(found);
                updateStats(found);
            }
        }
    };

    const updateStats = (currentSession: GameSession) => {
        setTotals(ScoringService.calculateTotalScores(currentSession));
        setPotSize(ScoringService.calculatePotSize(currentSession));
        setRankings(ScoringService.getRankings(currentSession));
    };

    const handleAddRound = async () => {
        if (!session) return;

        const scores: RoundScore[] = [];
        let isValid = true;
        let zeroCount = 0;
        let maxPenaltyExceeded = false;

        session.players.forEach(player => {
            if (session.eliminatedPlayerIds.includes(player.id)) return;

            const scoreStr = currentRoundScores[player.id];
            if (scoreStr === undefined || scoreStr === '') {
                scores.push({ playerId: player.id, score: 0 });
                zeroCount++;
            } else {
                const score = parseInt(scoreStr);
                if (isNaN(score)) {
                    isValid = false;
                } else {
                    scores.push({ playerId: player.id, score });
                    if (score === 0) zeroCount++;
                    if (score > session.config.maxPenalty) maxPenaltyExceeded = true;
                }
            }
        });

        if (!isValid) {
            Alert.alert('Error', 'Please enter valid numbers for all active players.');
            return;
        }

        // Validation A: Exactly one winner (score 0)
        if (zeroCount !== 1) {
            Alert.alert('Invalid Scores', `Exactly one player must have 0 points. Found ${zeroCount}.`);
            return;
        }

        // Validation B: Max Penalty Cap
        if (maxPenaltyExceeded) {
            Alert.alert(
                'High Score Warning',
                `One or more scores exceed the max penalty of ${session.config.maxPenalty}. Are you sure?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => processRound(scores) }
                ]
            );
            return;
        }

        await processRound(scores);
    };

    const processRound = async (scores: RoundScore[]) => {
        if (!session) return;

        const newRound: GameRound = {
            id: Date.now().toString(),
            scores,
            timestamp: Date.now(),
        };

        const updatedSession = {
            ...session,
            rounds: [...session.rounds, newRound],
        };

        const newTotals = ScoringService.calculateTotalScores(updatedSession);
        const newEliminatedIds = [...updatedSession.eliminatedPlayerIds];

        session.players.forEach(player => {
            if (!newEliminatedIds.includes(player.id)) {
                if (ScoringService.checkElimination(newTotals[player.id], session.config)) {
                    newEliminatedIds.push(player.id);
                    Alert.alert('Elimination!', `${player.name} has been eliminated!`);
                }
            }
        });

        updatedSession.eliminatedPlayerIds = newEliminatedIds;

        await saveSession(updatedSession);
        setScoreModalVisible(false);
        setCurrentRoundScores({});
    };

    const handleRebuy = async (playerId: string) => {
        if (!session) return;

        Alert.alert(
            'Re-buy',
            session.type === 'UNO' ? 'Allow re-entry?' : `Allow re-buy for $${session.config.buyIn}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        const updatedSession = { ...session };

                        updatedSession.rebuys = {
                            ...updatedSession.rebuys,
                            [playerId]: (updatedSession.rebuys[playerId] || 0) + 1
                        };

                        updatedSession.eliminatedPlayerIds = updatedSession.eliminatedPlayerIds.filter(id => id !== playerId);

                        const currentTotals = ScoringService.calculateTotalScores(session);
                        const activeScores = session.players
                            .filter(p => !session.eliminatedPlayerIds.includes(p.id))
                            .map(p => currentTotals[p.id]);

                        const maxActiveScore = Math.max(...activeScores, 0);
                        const adjustment = maxActiveScore - currentTotals[playerId];

                        const adjustmentRound: GameRound = {
                            id: `rebuy-${Date.now()}`,
                            scores: [{ playerId, score: adjustment }],
                            timestamp: Date.now(),
                        };

                        updatedSession.rounds.push(adjustmentRound);

                        await saveSession(updatedSession);
                    }
                }
            ]
        );
    };

    const handlePlayerPress = (player: Player) => {
        if (session?.eliminatedPlayerIds.includes(player.id)) {
            handleRebuy(player.id);
        }
    };

    const handleScorePress = (roundId: string, playerId: string, currentScore: number) => {
        if (readOnly) return;
        setEditingScore({ roundId, playerId, currentScore: currentScore.toString() });
        setEditModalVisible(true);
    };

    const handleSaveEditedScore = async () => {
        if (!session || !editingScore) return;

        const newScore = parseInt(editingScore.currentScore);
        if (isNaN(newScore)) {
            Alert.alert('Error', 'Please enter a valid number');
            return;
        }

        const updatedSession = { ...session };
        const roundIndex = updatedSession.rounds.findIndex(r => r.id === editingScore.roundId);

        if (roundIndex === -1) return;

        // Update the score in the round
        const scoreIndex = updatedSession.rounds[roundIndex].scores.findIndex(s => s.playerId === editingScore.playerId);
        if (scoreIndex >= 0) {
            updatedSession.rounds[roundIndex].scores[scoreIndex].score = newScore;
        } else {
            updatedSession.rounds[roundIndex].scores.push({ playerId: editingScore.playerId, score: newScore });
        }

        // Recalculate totals and elimination status
        const newTotals = ScoringService.calculateTotalScores(updatedSession);

        const newEliminatedIds: string[] = [];

        updatedSession.players.forEach(player => {
            if (ScoringService.checkElimination(newTotals[player.id], session.config)) {
                newEliminatedIds.push(player.id);
            }
        });

        updatedSession.eliminatedPlayerIds = newEliminatedIds;

        await saveSession(updatedSession);
        setEditModalVisible(false);
        setEditingScore(null);
    };

    const saveSession = async (updatedSession: GameSession) => {
        await StorageService.saveGameToHistory(updatedSession);
        await StorageService.saveCurrentSession(updatedSession);
        setSession(updatedSession);
        updateStats(updatedSession);
    };

    const handleEndGame = () => {
        Alert.alert(
            'End Game',
            'Are you sure you want to end the game and settle?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'End & Settle',
                    style: 'destructive',
                    onPress: async () => {
                        if (session) {
                            const endedSession = { ...session, isActive: false, endTime: Date.now() };
                            await saveSession(endedSession);
                            navigation.navigate('Settlement', { sessionId: session.id });
                        }
                    }
                }
            ]
        );
    };

    if (!session) return <View style={styles.loading}><Text>Loading...</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        if (readOnly) {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('History');
                            }
                        } else {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Home' }],
                            });
                        }
                    }}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{session.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleShare} style={styles.headerShareButton}>
                        <Text style={styles.headerShareButtonText}>📤</Text>
                    </TouchableOpacity>
                    {session.type !== 'UNO' && <Text style={styles.potText}>Pot: ${potSize}</Text>}
                    {!readOnly && (
                        <TouchableOpacity style={styles.headerAddButton} onPress={() => setAddPlayerModalVisible(true)}>
                            <Text style={styles.headerAddButtonText}>+ Player</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            ref={viewRef}
                            collapsable={false}
                        >
                            {/* Header Row */}
                            <View style={styles.tableRow}>
                                <View style={[styles.cell, styles.roundColumn, styles.headerBackground]}>
                                    <Text style={styles.headerText}>Round</Text>
                                </View>
                                {session.players.map(player => {
                                    const rank = rankings.find(r => r.playerId === player.id)?.rank;
                                    const isEliminated = session.eliminatedPlayerIds.includes(player.id);
                                    let statusText = "";

                                    if (!session.isActive) {
                                        statusText = rank ? ` (#${rank})` : "";
                                    } else if (isEliminated) {
                                        statusText = " (Out)";
                                    } else if (rank) {
                                        statusText = ` (#${rank})`;
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={[
                                                styles.cell,
                                                styles.playerColumn,
                                                styles.headerBackground,
                                                isEliminated && styles.eliminatedHeader
                                            ]}
                                            onPress={() => {
                                                const activeCount = session.players.length - session.eliminatedPlayerIds.length;
                                                if (activeCount > 1) {
                                                    handlePlayerPress(player);
                                                } else {
                                                    Alert.alert('Game Over', 'Cannot re-buy when only one player remains.');
                                                }
                                            }}
                                            disabled={readOnly || !isEliminated}
                                        >
                                            <Text style={styles.headerText} numberOfLines={1}>
                                                {player.name}
                                                <Text style={{ fontSize: 10, fontWeight: 'normal' }}>{statusText}</Text>
                                            </Text>
                                            {!readOnly && isEliminated && (
                                                <Text style={styles.eliminatedLabel}>
                                                    {(session.players.length - session.eliminatedPlayerIds.length) > 1 ? 'Tap to Rebuy' : 'Eliminated'}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Data Rows */}
                            {(() => {
                                let roundCounter = 0;
                                const rows: any[] = [];
                                let currentRebuyRow: any = null;

                                session.rounds.forEach((round) => {
                                    const isRebuy = round.id.startsWith('rebuy');
                                    const isJoin = round.id.startsWith('join');

                                    if (isRebuy || isJoin) {
                                        // We can merge joins into rebuys or keep them separate?
                                        // Let's treat them as special rows.
                                        // Actually, the current logic merges consecutive rebuys.
                                        // Let's just push them as separate rows for now to be safe, or merge if we want cleaner UI.
                                        // Simple: Just push as a row.
                                        const scoreMap: Record<string, number> = {};
                                        round.scores.forEach(s => scoreMap[s.playerId] = s.score);
                                        rows.push({
                                            id: round.id,
                                            type: isRebuy ? 'rebuy' : 'join',
                                            roundNumber: 0,
                                            scores: scoreMap
                                        });
                                    } else {
                                        currentRebuyRow = null;
                                        roundCounter++;
                                        const scoreMap: Record<string, number> = {};
                                        round.scores.forEach(s => scoreMap[s.playerId] = s.score);
                                        rows.push({
                                            id: round.id,
                                            type: 'round',
                                            roundNumber: roundCounter,
                                            scores: scoreMap
                                        });
                                    }
                                });

                                return rows.map((row) => (
                                    <Animated.View key={row.id} entering={FadeInDown.duration(400)} style={styles.tableRow}>
                                        <View style={[styles.cell, styles.roundColumn]}>
                                            <Text style={styles.cellText}>
                                                {row.type === 'rebuy' ? 'Rebuy' : row.type === 'join' ? 'Join' : row.roundNumber}
                                            </Text>
                                        </View>
                                        {session.players.map(player => {
                                            const score = row.scores[player.id] !== undefined ? row.scores[player.id] : '-';
                                            return (
                                                <TouchableOpacity
                                                    key={player.id}
                                                    style={[styles.cell, styles.playerColumn]}
                                                    onPress={() => row.type === 'round' && handleScorePress(row.id, player.id, typeof score === 'number' ? score : 0)}
                                                    disabled={readOnly || row.type !== 'round'}
                                                >
                                                    <Text style={styles.cellText}>{score}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </Animated.View>
                                ));
                            })()}

                            {/* Total Row */}
                            <View style={[styles.tableRow, styles.totalRow]}>
                                <View style={[styles.cell, styles.roundColumn]}>
                                    <Text style={styles.totalText}>Total</Text>
                                </View>
                                {session.players.map(player => (
                                    <View key={player.id} style={[styles.cell, styles.playerColumn]}>
                                        <Text style={styles.totalText}>{totals[player.id] || 0}</Text>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </ScrollView>
            </View>

            {!readOnly && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.endButton} onPress={handleEndGame}>
                        <Text style={styles.endButtonText}>End Game</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.addRoundButton} onPress={() => setScoreModalVisible(true)}>
                        <Text style={styles.addRoundButtonText}>Add Round</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Add Round Modal */}
            <Modal visible={isScoreModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Enter Scores</Text>
                        <TouchableOpacity onPress={() => setScoreModalVisible(false)}>
                            <Text style={styles.closeText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {session.players.map(player => {
                            if (session.eliminatedPlayerIds.includes(player.id)) return null;
                            return (
                                <View key={player.id} style={styles.inputRow}>
                                    <Text style={styles.inputLabel}>{player.name}</Text>
                                    <TextInput
                                        style={styles.scoreInput}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={currentRoundScores[player.id] || ''}
                                        onChangeText={(text) => setCurrentRoundScores(prev => ({ ...prev, [player.id]: text }))}
                                        placeholderTextColor={COLORS.textSecondary}
                                    />
                                </View>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity style={styles.saveRoundButton} onPress={handleAddRound}>
                        <Text style={styles.saveRoundButtonText}>Save Round</Text>
                    </TouchableOpacity>
                </View>

            </Modal>

            {/* Edit Score Modal */}
            <Modal visible={isEditModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.smallModalContainer}>
                        <Text style={styles.modalTitle}>Edit Score</Text>
                        <TextInput
                            style={styles.largeInput}
                            keyboardType="numeric" // Allow negative numbers? numeric usually does.
                            value={editingScore?.currentScore || ''}
                            onChangeText={(text) => setEditingScore(prev => prev ? { ...prev, currentScore: text } : null)}
                            autoFocus={true}
                            selectTextOnFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveEditedScore}>
                                <Text style={styles.modalButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Player Modal */}
            <Modal visible={isAddPlayerModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.smallModalContainer}>
                        <Text style={styles.modalTitle}>Add New Player</Text>
                        <TextInput
                            style={styles.largeInput}
                            placeholder="Player Name"
                            value={newPlayerName}
                            onChangeText={setNewPlayerName}
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddPlayerModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddPlayer}>
                                <Text style={styles.modalButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: { padding: SPACING.s, marginRight: SPACING.s },
    backButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' },
    headerTitle: { fontSize: FONT_SIZE.m, fontWeight: 'bold', flex: 1, color: COLORS.text },
    potText: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.success, marginRight: 10 },
    headerAddButton: { padding: 8, backgroundColor: COLORS.secondary, borderRadius: 8 },
    headerAddButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONT_SIZE.s },
    headerShareButton: { padding: 8, marginRight: 10 },
    headerShareButtonText: { fontSize: 24 },

    tableContainer: { flex: 1, padding: SPACING.s },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, minHeight: 50, backgroundColor: COLORS.card },

    cell: { justifyContent: 'center', padding: SPACING.s, borderRightWidth: 1, borderRightColor: COLORS.border },
    roundColumn: { width: 60, backgroundColor: COLORS.background, alignItems: 'center' },
    playerColumn: { width: 100, alignItems: 'center' },

    headerBackground: { backgroundColor: COLORS.background },
    headerText: { fontWeight: 'bold', color: COLORS.text, textAlign: 'center', fontSize: FONT_SIZE.s },
    cellText: { fontSize: FONT_SIZE.m, color: COLORS.text },

    totalRow: { backgroundColor: '#E6FFE6', borderTopWidth: 2, borderTopColor: COLORS.success },
    totalText: { fontWeight: 'bold', fontSize: FONT_SIZE.m, color: COLORS.black },

    eliminatedHeader: { backgroundColor: '#FFF0F0' },
    eliminatedLabel: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginTop: 2, fontWeight: 'bold', textAlign: 'center' },

    footer: { padding: SPACING.l, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between' },
    endButton: { padding: SPACING.m, backgroundColor: COLORS.danger, borderRadius: 12, flex: 1, marginRight: SPACING.m, alignItems: 'center', ...SHADOWS.small },
    endButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONT_SIZE.m },
    addRoundButton: { padding: SPACING.m, backgroundColor: COLORS.success, borderRadius: 12, flex: 2, alignItems: 'center', ...SHADOWS.small },
    addRoundButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONT_SIZE.l },

    modalContainer: { flex: 1, padding: SPACING.l, backgroundColor: COLORS.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.l },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.text },
    closeText: { fontSize: FONT_SIZE.m, color: COLORS.primary, fontWeight: '600' },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.s, ...SHADOWS.small },
    inputLabel: { fontSize: FONT_SIZE.m, fontWeight: '500', color: COLORS.text },
    scoreInput: { fontSize: FONT_SIZE.l, fontWeight: 'bold', textAlign: 'right', minWidth: 50, borderBottomWidth: 1, borderBottomColor: COLORS.border, color: COLORS.text },
    saveRoundButton: { backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: 12, alignItems: 'center', marginTop: SPACING.l, ...SHADOWS.medium },
    saveRoundButtonText: { color: COLORS.white, fontSize: FONT_SIZE.l, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    smallModalContainer: { width: '80%', backgroundColor: COLORS.background, borderRadius: 16, padding: SPACING.l, ...SHADOWS.medium },
    largeInput: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', borderBottomWidth: 2, borderBottomColor: COLORS.primary, marginVertical: SPACING.l, color: COLORS.text },
    modalButtons: { flexDirection: 'row', gap: SPACING.m },
    modalButton: { flex: 1, padding: SPACING.m, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    saveButton: { backgroundColor: COLORS.primary },
    modalButtonText: { fontWeight: 'bold', fontSize: FONT_SIZE.m, color: COLORS.text },
});

export default ScoreboardScreen;
