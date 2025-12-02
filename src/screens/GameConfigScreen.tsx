import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GameConfig, Player, GameSession } from '../types';
import { StorageService } from '../utils/storage';

const GameConfigScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { players, gameType = 'RUMMY' } = route.params || { players: [] };

    const [config, setConfig] = useState<GameConfig>({
        buyIn: gameType === 'UNO' ? 0 : 5,
        scootPenalty: 25,
        middleScootPenalty: 40,
        maxPenalty: 80,
        eliminationThreshold: gameType === 'UNO' ? 500 : 220,
    });

    const updateConfig = (key: keyof GameConfig, value: string) => {
        const numValue = parseInt(value) || 0;
        setConfig(prev => ({ ...prev, [key]: numValue }));
    };

    const handleStartGame = async () => {
        // Create new Game Session
        const newSession: GameSession = {
            id: Date.now().toString(),
            title: `${gameType === 'UNO' ? 'UNO' : 'Rummy'}-${new Date().toLocaleString()}`,
            players: players,
            config: config,
            rounds: [],
            eliminatedPlayerIds: [],
            rebuys: {},
            isActive: true,
            startTime: Date.now(),
            type: gameType,
        };

        // Save to history and set as current session
        await StorageService.saveGameToHistory(newSession);
        await StorageService.saveCurrentSession(newSession);

        // Navigate to Scoreboard
        navigation.reset({
            index: 0,
            routes: [{ name: 'Scoreboard', params: { sessionId: newSession.id } }],
        });
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>{gameType === 'UNO' ? 'UNO Setup' : 'Game Configuration'}</Text>
                    <Text style={styles.subtitle}>Customize rules for this session</Text>
                </View>

                <View style={styles.form}>
                    {gameType === 'RUMMY' && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Buy-in Amount ($)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={config.buyIn.toString()}
                                    onChangeText={(v) => updateConfig('buyIn', v)}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Scoot / First Drop Penalty</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={config.scootPenalty.toString()}
                                    onChangeText={(v) => updateConfig('scootPenalty', v)}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Middle Scoot / Middle Drop Penalty</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={config.middleScootPenalty.toString()}
                                    onChangeText={(v) => updateConfig('middleScootPenalty', v)}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Max Penalty / Cap</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={config.maxPenalty.toString()}
                                    onChangeText={(v) => updateConfig('maxPenalty', v)}
                                />
                            </View>
                        </>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Elimination Threshold (> Points)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={config.eliminationThreshold.toString()}
                            onChangeText={(v) => updateConfig('eliminationThreshold', v)}
                        />
                        <Text style={styles.helperText}>Player is out if score {'>'} {config.eliminationThreshold}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
                    <Text style={styles.startButtonText}>Start Game</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContent: { padding: 20 },
    header: { marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
    form: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 18, backgroundColor: '#fafafa' },
    helperText: { fontSize: 12, color: '#888', marginTop: 5 },
    startButton: { backgroundColor: '#34C759', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30, shadowColor: '#34C759', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
    startButtonText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});

export default GameConfigScreen;
