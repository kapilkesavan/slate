import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameType, PlayerGroup } from '../types';
import { StorageService } from '../utils/storage';

export default function RankingGroupSelectScreen({ navigation, route }: any) {
    const { gameType } = route.params as { gameType: GameType };
    const [groups, setGroups] = useState<PlayerGroup[]>([]);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            loadGroups();
        }
    }, [isFocused]);

    const loadGroups = async () => {
        const storedGroups = await StorageService.getGroups();
        setGroups(storedGroups);
    };

    const handleSelectGroup = (group: PlayerGroup) => {
        navigation.navigate('RankingLeaderboard', { gameType, group });
    };

    const renderItem = ({ item }: { item: PlayerGroup }) => (
        <TouchableOpacity
            style={styles.groupCard}
            onPress={() => handleSelectGroup(item)}
        >
            <View>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.playerCount}>
                    {item.playerIds.length} Players
                </Text>
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Select Group</Text>
                    <Text style={styles.subtitle}>Ranking for {gameType}</Text>
                </View>
            </View>

            <FlatList
                data={groups}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No groups found</Text>
                        <Text style={styles.emptySubtext}>Create a group in Game Setup first</Text>
                    </View>
                }
            />
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    groupCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    groupName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    playerCount: {
        fontSize: 14,
        color: '#666',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrow: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
});
