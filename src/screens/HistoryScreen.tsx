import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { GameSession } from '../types';
import { ScoringService } from '../utils/scoring';
import { StorageService } from '../utils/storage';

const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const [history, setHistory] = useState<GameSession[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await StorageService.getGameHistory();
        // Sort by newest first
        setHistory(data.sort((a, b) => b.startTime - a.startTime));
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

    const renderItem = ({ item, index }: { item: GameSession; index: number }) => {
        const potSize = ScoringService.calculatePotSize(item);
        const winner = item.isActive ? 'In Progress' : 'Finished'; // We could calculate winner here if we want

        return (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('Scoreboard', { sessionId: item.id, readOnly: !item.isActive })}
                >
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.gameTitle}>{item.title}</Text>
                            <Text style={styles.gameType}>{item.type === 'UNO' ? 'UNO' : 'Rummy'}</Text>
                        </View>
                        <Text style={[styles.statusBadge, item.isActive ? styles.activeStatus : styles.finishedStatus]}>
                            {item.isActive ? 'Active' : 'Finished'}
                        </Text>
                    </View>

                    <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>

                    <View style={styles.cardFooter}>
                        <Text style={styles.playersText}>{item.players.length} Players</Text>
                        {item.type !== 'UNO' && <Text style={styles.potText}>Pot: ${potSize}</Text>}
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Game History</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={history}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No games played yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.m, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backButton: { padding: SPACING.s },
    backButtonText: { fontSize: FONT_SIZE.xl, color: COLORS.primary, fontWeight: 'bold' },
    headerTitle: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.text },

    listContent: { padding: SPACING.m },

    card: { backgroundColor: COLORS.card, borderRadius: 12, padding: SPACING.m, marginBottom: SPACING.m, ...SHADOWS.small },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
    gameTitle: { fontSize: FONT_SIZE.l, fontWeight: 'bold', color: COLORS.text },
    gameType: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary, marginTop: 2 },
    statusBadge: { fontSize: FONT_SIZE.xs, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
    activeStatus: { backgroundColor: '#E3F2FD', color: COLORS.primary },
    finishedStatus: { backgroundColor: '#E8F5E9', color: COLORS.success },

    dateText: { fontSize: FONT_SIZE.s, color: COLORS.textSecondary, marginBottom: SPACING.m },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.s },
    playersText: { fontSize: FONT_SIZE.m, color: COLORS.text },
    potText: { fontSize: FONT_SIZE.m, fontWeight: 'bold', color: COLORS.success },

    emptyState: { alignItems: 'center', marginTop: SPACING.xxl },
    emptyText: { fontSize: FONT_SIZE.m, color: COLORS.textSecondary },
});

export default HistoryScreen;
