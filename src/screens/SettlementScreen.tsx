
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Sharing from 'expo-sharing'; // Added import
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert // Added Alert import
    ,

    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot'; // Added import
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';
import { GameSession, Settlement } from '../types';
import { ScoringService } from '../utils/scoring';
import { SettlementService } from '../utils/settlement';
import { StorageService } from '../utils/storage';

const SettlementScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { sessionId } = route.params || {};
    const viewRef = useRef<View>(null); // Added useRef

    const [session, setSession] = useState<GameSession | null>(null);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [transfers, setTransfers] = useState<{ from: string; to: string; amount: number }[]>([]);
    const [potSize, setPotSize] = useState(0);

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        const history = await StorageService.getGameHistory();
        const found = history.find(s => s.id === sessionId);

        if (found) {
            setSession(found);
            setPotSize(ScoringService.calculatePotSize(found));

            const calculatedSettlements = SettlementService.calculateSettlements(found);
            setSettlements(calculatedSettlements);

            const calculatedTransfers = SettlementService.calculateTransfers(calculatedSettlements);
            setTransfers(calculatedTransfers);
        }
    };

    const getPlayerName = (id: string) => {
        return session?.players.find(p => p.id === id)?.name || 'Unknown';
    };

    const handleShare = async () => { // Added handleShare function
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

    const handleHome = () => {
        // Clear current session as game is over
        StorageService.clearCurrentSession();
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    const handleSplitPot = () => {
        if (!session) return;

        Alert.alert(
            'Split Pot',
            'Are you sure you want to split the remaining pot equally among active players?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Split',
                    onPress: () => {
                        const activePlayers = session.players.filter(p => !session.eliminatedPlayerIds.includes(p.id));
                        if (activePlayers.length === 0) return;

                        const pot = ScoringService.calculatePotSize(session);
                        const splitAmount = pot / activePlayers.length;
                        const buyIn = session.config.buyIn;

                        // Create new settlements based on split
                        const newSettlements: Settlement[] = session.players.map(player => {
                            const isEliminated = session.eliminatedPlayerIds.includes(player.id);
                            const rebuys = session.rebuys[player.id] || 0;
                            const totalInvested = buyIn + (rebuys * buyIn);

                            let payout = 0;
                            if (!isEliminated) {
                                payout = splitAmount;
                            }

                            return {
                                playerId: player.id,
                                rank: isEliminated ? 99 : 1, // Active players tied for 1st
                                amount: payout - totalInvested
                            };
                        }).sort((a, b) => a.rank - b.rank);

                        setSettlements(newSettlements);
                        setTransfers(SettlementService.calculateTransfers(newSettlements));
                    }
                }
            ]
        );
    };

    if (!session) return <View style={styles.loading}><Text>Loading...</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} ref={viewRef as any} collapsable={false} style={{ backgroundColor: COLORS.background }}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
                    <Text style={styles.title}>Game Over</Text>
                    <Text style={styles.subtitle}>Final Settlement</Text>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    {session.type !== 'UNO' && <Text style={styles.potText}>Total Pot: ${potSize}</Text>}
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Rankings & Net Winnings</Text>
                    {settlements.map((s, index) => (
                        <View key={s.playerId} style={styles.row}>
                            <View style={[styles.rankContainer, index === 0 && styles.winnerRank]}>
                                <Text style={[styles.rankText, index === 0 && styles.winnerText]}>#{s.rank}</Text>
                            </View>
                            <Text style={[styles.nameText, index === 0 && styles.winnerName]}>{getPlayerName(s.playerId)}</Text>
                            {session.type !== 'UNO' && (
                                <Text style={[
                                    styles.amountText,
                                    s.amount >= 0 ? styles.positive : styles.negative
                                ]}>
                                    {s.amount >= 0 ? '+' : ''}${s.amount.toFixed(2)}
                                </Text>
                            )}
                        </View>
                    ))}
                </Animated.View>



                {session.type !== 'UNO' && (
                    <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Who Owes Whom</Text>
                        {transfers.length === 0 ? (
                            <Text style={styles.emptyText}>No transfers needed.</Text>
                        ) : (
                            transfers.map((t, index) => (
                                <Animated.View
                                    key={index}
                                    entering={ZoomIn.delay(600 + (index * 100)).duration(400)}
                                    style={styles.transferCard}
                                >
                                    <View style={styles.transferRow}>
                                        <View style={styles.transferSide}>
                                            <Text style={styles.debtorName}>{getPlayerName(t.from)}</Text>
                                            <Text style={styles.transferLabel}>pays</Text>
                                        </View>
                                        <View style={styles.transferArrow}>
                                            <Text style={styles.arrowText}>➔</Text>
                                            <Text style={styles.transferAmount}>${t.amount.toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.transferSide}>
                                            <Text style={styles.creditorName}>{getPlayerName(t.to)}</Text>
                                            <Text style={styles.transferLabel}>receives</Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            ))
                        )}
                    </Animated.View>
                )}

                <Animated.View entering={FadeInUp.delay(800).duration(600)}>
                    {session.type !== 'UNO' && (
                        <TouchableOpacity style={styles.splitButton} onPress={handleSplitPot}>
                            <Text style={styles.splitButtonText}>Split Pot / Shake Hands</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Text style={styles.shareButtonText}>Share Result</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
                        <Text style={styles.homeButtonText}>Back to Home</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: SPACING.l },
    header: { alignItems: 'center', marginBottom: SPACING.xl },
    title: { fontSize: FONT_SIZE.xxxl, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.xs },
    subtitle: { fontSize: FONT_SIZE.l, color: COLORS.textSecondary, marginBottom: SPACING.m },
    sessionTitle: { fontSize: FONT_SIZE.m, color: COLORS.textSecondary, marginBottom: SPACING.s, fontWeight: '600' },
    potText: { fontSize: FONT_SIZE.xl, fontWeight: 'bold', color: COLORS.success },

    section: { backgroundColor: COLORS.card, borderRadius: 16, padding: SPACING.m, marginBottom: SPACING.l, ...SHADOWS.medium },
    sectionTitle: { fontSize: FONT_SIZE.l, fontWeight: 'bold', marginBottom: SPACING.m, color: COLORS.text },

    row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m },
    rankContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m },
    winnerRank: { backgroundColor: '#FFD700' }, // Gold
    rankText: { fontWeight: 'bold', color: COLORS.textSecondary },
    winnerText: { color: COLORS.black },
    nameText: { flex: 1, fontSize: FONT_SIZE.m, color: COLORS.text },
    winnerName: { fontWeight: 'bold' },
    amountText: { fontSize: FONT_SIZE.m, fontWeight: 'bold' },
    positive: { color: COLORS.success },
    negative: { color: COLORS.danger },

    transferCard: { backgroundColor: COLORS.background, borderRadius: 12, padding: SPACING.m, marginBottom: SPACING.s },
    transferRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    transferSide: { alignItems: 'center', flex: 1 },
    debtorName: { fontWeight: 'bold', color: COLORS.danger, fontSize: FONT_SIZE.m },
    creditorName: { fontWeight: 'bold', color: COLORS.success, fontSize: FONT_SIZE.m },
    transferLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginTop: 2 },
    transferArrow: { alignItems: 'center', paddingHorizontal: SPACING.s },
    arrowText: { fontSize: FONT_SIZE.l, color: COLORS.textSecondary },
    transferAmount: { fontSize: FONT_SIZE.m, fontWeight: 'bold', color: COLORS.text, marginTop: 2 },

    emptyText: { color: COLORS.textSecondary, fontStyle: 'italic', textAlign: 'center', marginVertical: SPACING.m },

    homeButton: { backgroundColor: COLORS.primary, padding: SPACING.m, borderRadius: 16, alignItems: 'center', marginTop: SPACING.s, ...SHADOWS.medium },
    homeButtonText: { color: COLORS.white, fontSize: FONT_SIZE.l, fontWeight: 'bold' },
    splitButton: { backgroundColor: COLORS.secondary, padding: SPACING.m, borderRadius: 16, alignItems: 'center', marginTop: SPACING.s, marginBottom: SPACING.s, ...SHADOWS.medium },
    splitButtonText: { color: COLORS.white, fontSize: FONT_SIZE.m, fontWeight: 'bold' },
    shareButton: { backgroundColor: COLORS.text, padding: SPACING.m, borderRadius: 16, alignItems: 'center', marginBottom: SPACING.s, ...SHADOWS.medium },
    shareButtonText: { color: COLORS.white, fontSize: FONT_SIZE.m, fontWeight: 'bold' },
});

export default SettlementScreen;
