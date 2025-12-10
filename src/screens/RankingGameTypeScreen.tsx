import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameType } from '../types';

export default function RankingGameTypeScreen({ navigation }: any) {
    const handleSelectType = (type: GameType) => {
        navigation.navigate('RankingGroupSelect', { gameType: type });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Select Game Type</Text>
                    <Text style={styles.subtitle}>View ranking for which game?</Text>
                </View>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleSelectType('RUMMY')}
                >
                    <Text style={styles.cardTitle}>Rummy</Text>
                    <Text style={styles.cardSubtitle}>View Leaderboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.unoCard]}
                    onPress={() => handleSelectType('UNO')}
                >
                    <Text style={styles.cardTitle}>UNO</Text>
                    <Text style={styles.cardSubtitle}>View Leaderboard</Text>
                </TouchableOpacity>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    unoCard: {
        borderColor: '#e0e0e0',
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
});
