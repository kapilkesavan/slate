import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameType, PlayerGroup, PlayerStats } from '../types';
import { StatsService } from '../utils/stats';
import { StorageService } from '../utils/storage';

export default function RankingLeaderboardScreen({ route, navigation }: any) {
    const { gameType, group } = route.params as { gameType: GameType; group: PlayerGroup };
    const [stats, setStats] = useState<PlayerStats[]>([]);

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        const history = await StorageService.getGameHistory();
        const players = await StorageService.getPlayers();

        const calculatedStats = StatsService.calculatePlayerStats(history, players, gameType, group);
        setStats(calculatedStats);
    };

    const renderHeader = () => (
        <View style={styles.row}>
            <Text style={[styles.cell, styles.rankCell, styles.headerText]}>#</Text>
            <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Player</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>1st</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>2nd</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>3rd</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>H.T</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>R.W</Text>
            <Text style={[styles.cell, styles.statCell, styles.headerText]}>T.M</Text>
            <Text style={[styles.cell, styles.totalCell, styles.headerText]}>Total</Text>
        </View>
    );

    const renderItem = ({ item, index }: { item: PlayerStats; index: number }) => (
        <View style={styles.row}>
            <Text style={[styles.cell, styles.rankCell]}>{index + 1}</Text>
            <Text style={[styles.cell, styles.nameCell]} numberOfLines={1}>{item.playerName}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.firstPlace}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.secondPlace}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.thirdPlace}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.hatTricks}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.roundsWon}</Text>
            <Text style={[styles.cell, styles.statCell]}>{item.totalMatches}</Text>
            <Text style={[styles.cell, styles.totalCell, styles.totalText]}>{item.totalPodiums}</Text>
        </View>
    );

    const renderFooter = () => (
        <View style={styles.excludeFooter}>
            <Text style={styles.legendText}>H.T: Hat-trick</Text>
            <Text style={styles.legendText}>R.W: Rounds Won</Text>
            <Text style={styles.legendText}>T.M: Total Matches</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Leaderboard</Text>
                    <Text style={styles.subtitle}>{gameType} - {group.name}</Text>
                </View>
            </View>

            <View style={styles.tableContainer}>
                {renderHeader()}
                <FlatList
                    data={stats}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.playerId}
                    contentContainerStyle={styles.listContent}
                    ListFooterComponent={renderFooter}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    cell: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    headerText: {
        fontWeight: 'bold',
        color: '#666',
        fontSize: 12,
    },
    rankCell: {
        width: 30,
        fontWeight: 'bold',
        color: '#888',
    },
    nameCell: {
        flex: 2,
        textAlign: 'left',
        paddingLeft: 8,
        fontWeight: '600',
    },
    statCell: {
        width: 35,
    },
    totalCell: {
        width: 45,
    },
    totalText: {
        fontWeight: 'bold',
        color: '#000',
    },
    listContent: {
        paddingBottom: 20,
    },
    excludeFooter: {
        padding: 16,
        backgroundColor: '#fafafa',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    legendText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});
