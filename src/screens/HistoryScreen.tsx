import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { GameSession, SettlementSnapshot } from '../types';
import { ScoringService } from '../utils/scoring';
import { StorageService } from '../utils/storage';

const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const [history, setHistory] = useState<GameSession[]>([]);
    const [settlements, setSettlements] = useState<SettlementSnapshot[]>([]);
    const [activeTab, setActiveTab] = useState<'scorecards' | 'settlements'>('scorecards');

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        const historyData = await StorageService.getGameHistory();
        setHistory(historyData.sort((a, b) => b.startTime - a.startTime));

        const settlementsData = await StorageService.getSettlements();
        // Sort by date desc
        setSettlements(settlementsData.sort((a: any, b: any) => b.date - a.date));
    };

    const toggleSettlementStatus = async (item: SettlementSnapshot) => {
        const newStatus = item.status === 'PAID' ? 'UNPAID' : 'PAID';
        await StorageService.updateSettlementStatus(item.id, newStatus);

        // Update local state immediately
        setSettlements(prev => prev.map(s =>
            s.id === item.id ? { ...s, status: newStatus } : s
        ));
    };

    const deleteGame = async (sessionId: string) => {
        Alert.alert(
            "Delete Game",
            "Are you sure you want to delete this game record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await StorageService.deleteGameSession(sessionId);
                        loadData();
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRightActions = (sessionId: string) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => deleteGame(sessionId)}
            >
                <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    const renderGameItem = ({ item, index }: { item: GameSession; index: number }) => {
        const potSize = ScoringService.calculatePotSize(item);

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <Swipeable renderRightActions={() => renderRightActions(item.id)}>
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('Scoreboard', { sessionId: item.id, readOnly: !item.isActive })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1, marginRight: SPACING.s }}>
                                <Text style={styles.gameTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                                <Text style={styles.gameType}>{item.type === 'UNO' ? 'UNO' : 'Rummy'}</Text>
                            </View>
                            <View style={{ flexShrink: 0 }}>
                                <Text style={[styles.statusBadge, item.isActive ? styles.activeStatus : styles.finishedStatus]}>
                                    {item.isActive ? 'Active' : 'Finished'}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>

                        <View style={styles.cardFooter}>
                            <Text style={styles.playersText}>{item.players.length} Players</Text>
                            {item.type !== 'UNO' && <Text style={styles.potText}>Pot: ${potSize}</Text>}
                        </View>
                    </TouchableOpacity>
                </Swipeable>
            </Animated.View>
        );
    };

    const renderSettlementItem = ({ item, index }: { item: SettlementSnapshot; index: number }) => {
        return (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Settlement', { sessionId: item.id })}
                >
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1, marginRight: SPACING.s }}>
                            <Text style={styles.gameTitle} numberOfLines={1} ellipsizeMode="tail">{item.gameTitle}</Text>
                            <Text style={styles.gameType}>Settled</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => toggleSettlementStatus(item)}
                            style={{ flexShrink: 0 }}
                        >
                            <Text style={[
                                styles.statusBadge,
                                item.status === 'PAID' ? styles.paidStatus : styles.unpaidStatus
                            ]}>
                                {item.status === 'PAID' ? 'Paid' : 'Unpaid'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>

                    <View style={styles.cardFooter}>
                        <Text style={styles.playersText}>{item.transfers.length} Transfers</Text>
                        {item.gameType !== 'UNO' && <Text style={styles.potText}>Pot: ${item.potSize}</Text>}
                    </View>

                    {/* Mini summary of transfers if needed, or just keep it simple */}
                    {/* Requirement: "Display a specific history of the financial results." */}
                    {/* Let's show up to 2 transfers as preview */}
                    {item.transfers.length > 0 && (
                        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                            {item.transfers.slice(0, 2).map((t, i) => (
                                <Text key={i} style={{ fontSize: 12, color: COLORS.textSecondary }}>
                                    {t.from} ➔ {t.to}: ${t.amount}
                                </Text>
                            ))}
                            {item.transfers.length > 2 && <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>+ {item.transfers.length - 2} more</Text>}
                        </View>
                    )}

                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: SPACING.s, marginRight: SPACING.s, marginLeft: -SPACING.s }}>
                        <Text style={{ fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' }}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Game History</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'scorecards' && styles.activeTab]}
                        onPress={() => setActiveTab('scorecards')}
                    >
                        <Text style={[styles.tabText, activeTab === 'scorecards' && styles.activeTabText]}>Score Cards</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'settlements' && styles.activeTab]}
                        onPress={() => setActiveTab('settlements')}
                    >
                        <Text style={[styles.tabText, activeTab === 'settlements' && styles.activeTabText]}>Settlements</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.content}>
                {activeTab === 'scorecards' ? (
                    history.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No game history yet.</Text>
                            <TouchableOpacity style={styles.newGameButton} onPress={() => navigation.navigate('GroupSelection')}>
                                <Text style={styles.newGameButtonText}>Start New Game</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={history}
                            renderItem={renderGameItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                        />
                    )
                ) : (
                    settlements.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No settlements yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={settlements}
                            renderItem={renderSettlementItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContainer}
                            showsVerticalScrollIndicator={false}
                        />
                    )
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    headerContainer: { padding: SPACING.l, paddingBottom: SPACING.m, backgroundColor: COLORS.background },
    title: { fontSize: FONT_SIZE.xxxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.m },

    tabContainer: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 12, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    activeTab: { backgroundColor: COLORS.primary },
    tabText: { fontWeight: '600', color: COLORS.textSecondary },
    activeTabText: { color: COLORS.white },

    content: { flex: 1, paddingHorizontal: SPACING.l },
    listContainer: { paddingBottom: SPACING.xl },

    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.m, marginBottom: SPACING.m, ...SHADOWS.medium },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.s },
    gameTitle: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.text },
    gameType: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary, marginTop: 2 },
    dateText: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary },

    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, overflow: 'hidden', fontSize: FONT_SIZE.xs, fontWeight: 'bold' },
    activeStatus: { backgroundColor: '#E0F2F1', color: COLORS.secondary },
    finishedStatus: { backgroundColor: '#F5F5F5', color: COLORS.textSecondary },
    paidStatus: { backgroundColor: '#E6FFE6', color: COLORS.success, borderWidth: 1, borderColor: COLORS.success },
    unpaidStatus: { backgroundColor: '#FFF0F0', color: COLORS.danger, borderWidth: 1, borderColor: COLORS.danger },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.s, marginTop: SPACING.s },
    playersText: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary },
    potText: { fontSize: FONT_SIZE.m, fontWeight: 'bold', color: COLORS.success },

    deleteAction: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 80, height: '100%', borderRadius: 16, marginBottom: SPACING.m, marginLeft: SPACING.s },
    deleteActionText: { color: COLORS.white, fontWeight: 'bold' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: FONT_SIZE.m, color: COLORS.textSecondary },
    newGameButton: { marginTop: SPACING.m, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.m, borderRadius: 12, ...SHADOWS.medium },
    newGameButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONT_SIZE.m },
});

export default HistoryScreen;
