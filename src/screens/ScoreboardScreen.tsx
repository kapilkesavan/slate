import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
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
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { GameRound, GameSession, Player, RoundScore } from '../types';
import { ScoringService } from '../utils/scoring';
import { StorageService } from '../utils/storage';

const ScoreboardScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { sessionId, readOnly } = route.params || {};

    const [session, setSession] = useState<GameSession | null>(null);
    const [totals, setTotals] = useState<Record<string, number>>({});
    const [potSize, setPotSize] = useState(0);

    // Modal State
    const [isScoreModalVisible, setScoreModalVisible] = useState(false);
    const [currentRoundScores, setCurrentRoundScores] = useState<Record<string, string>>({});

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
    };

    const handleAddRound = async () => {
        if (!session) return;

        const scores: RoundScore[] = [];
        let isValid = true;

        session.players.forEach(player => {
            if (session.eliminatedPlayerIds.includes(player.id)) return;

            const scoreStr = currentRoundScores[player.id];
            if (scoreStr === undefined || scoreStr === '') {
                scores.push({ playerId: player.id, score: 0 });
            } else {
                const score = parseInt(scoreStr);
                if (isNaN(score)) {
                    isValid = false;
                } else {
                    scores.push({ playerId: player.id, score });
                }
            }
        });

        if (!isValid) {
            Alert.alert('Error', 'Please enter valid numbers for all active players.');
            return;
        }

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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{session.title}</Text>
                {session.type !== 'UNO' && <Text style={styles.potText}>Pot: ${potSize}</Text>}
            </View>

            <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                    <View>
                        <ScrollView showsVerticalScrollIndicator={true}>
                            {/* Header Row */}
                            <View style={styles.tableRow}>
                                <View style={[styles.cell, styles.roundColumn, styles.headerBackground]}>
                                    <Text style={styles.headerText}>Round</Text>
                                </View>
                                {session.players.map(player => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={[
                                            styles.cell,
                                            styles.playerColumn,
                                            styles.headerBackground,
                                            session.eliminatedPlayerIds.includes(player.id) && styles.eliminatedHeader
                                        ]}
                                        onPress={() => handlePlayerPress(player)}
                                        disabled={readOnly || !session.eliminatedPlayerIds.includes(player.id)}
                                    >
                                        <Text style={styles.headerText} numberOfLines={1}>{player.name}</Text>
                                        {!readOnly && session.eliminatedPlayerIds.includes(player.id) && (
                                            <Text style={styles.eliminatedLabel}>OUT (Tap to Rebuy)</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Data Rows */}
                            {(() => {
                                let roundCounter = 0;
                                const rows: any[] = [];
                                let currentRebuyRow: any = null;

                                session.rounds.forEach((round) => {
                                    const isRebuy = round.id.startsWith('rebuy');

                                    if (isRebuy) {
                                        if (!currentRebuyRow) {
                                            currentRebuyRow = {
                                                id: 'merged-' + round.id,
                                                type: 'rebuy',
                                                scores: {}
                                            };
                                            rows.push(currentRebuyRow);
                                        }
                                        round.scores.forEach(s => {
                                            currentRebuyRow.scores[s.playerId] = (currentRebuyRow.scores[s.playerId] || 0) + s.score;
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
                                            <Text style={styles.cellText}>{row.type === 'rebuy' ? 'Rebuy' : row.roundNumber}</Text>
                                        </View>
                                        {session.players.map(player => {
                                            const score = row.scores[player.id] !== undefined ? row.scores[player.id] : '-';
                                            return (
                                                <View key={player.id} style={[styles.cell, styles.playerColumn]}>
                                                    <Text style={styles.cellText}>{score}</Text>
                                                </View>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backButton: { padding: SPACING.s, marginRight: SPACING.s },
    backButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' },
    headerTitle: { fontSize: FONT_SIZE.m, fontWeight: 'bold', flex: 1, color: COLORS.text },
    potText: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.success },

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
});

export default ScoreboardScreen;
