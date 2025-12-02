import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameSession, Player, PlayerGroup } from '../types';

const KEYS = {
    PLAYERS: 'score_tracker_players',
    GAME_HISTORY: 'score_tracker_history',
    CURRENT_SESSION: 'score_tracker_current_session',
    GROUPS: 'score_tracker_groups',
};

export const StorageService = {
    // --- Players ---
    getPlayers: async (): Promise<Player[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.PLAYERS);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading players', e);
            return [];
        }
    },

    savePlayers: async (players: Player[]): Promise<void> => {
        try {
            const jsonValue = JSON.stringify(players);
            await AsyncStorage.setItem(KEYS.PLAYERS, jsonValue);
        } catch (e) {
            console.error('Error saving players', e);
        }
    },

    addPlayer: async (player: Player): Promise<void> => {
        const players = await StorageService.getPlayers();
        const updatedPlayers = [...players, player];
        await StorageService.savePlayers(updatedPlayers);
    },

    // --- Game History ---
    getGameHistory: async (): Promise<GameSession[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.GAME_HISTORY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading history', e);
            return [];
        }
    },

    saveGameToHistory: async (session: GameSession): Promise<void> => {
        const history = await StorageService.getGameHistory();
        // Check if session already exists and update it, or add new
        const index = history.findIndex((s) => s.id === session.id);
        let updatedHistory;
        if (index >= 0) {
            updatedHistory = [...history];
            updatedHistory[index] = session;
        } else {
            updatedHistory = [session, ...history];
        }

        try {
            await AsyncStorage.setItem(KEYS.GAME_HISTORY, JSON.stringify(updatedHistory));
        } catch (e) {
            console.error('Error saving history', e);
        }
    },

    // --- Current Session (for recovery) ---
    getCurrentSession: async (): Promise<GameSession | null> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.CURRENT_SESSION);
            return jsonValue != null ? JSON.parse(jsonValue) : null;
        } catch (e) {
            console.error('Error reading current session', e);
            return null;
        }
    },

    saveCurrentSession: async (session: GameSession): Promise<void> => {
        try {
            await AsyncStorage.setItem(KEYS.CURRENT_SESSION, JSON.stringify(session));
        } catch (e) {
            console.error('Error saving current session', e);
        }
    },

    clearCurrentSession: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(KEYS.CURRENT_SESSION);
        } catch (e) {
            console.error('Error clearing current session', e);
        }
    },

    // --- Player Groups ---
    getGroups: async (): Promise<PlayerGroup[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(KEYS.GROUPS);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Error reading groups', e);
            return [];
        }
    },

    saveGroups: async (groups: PlayerGroup[]): Promise<void> => {
        try {
            const jsonValue = JSON.stringify(groups);
            await AsyncStorage.setItem(KEYS.GROUPS, jsonValue);
        } catch (e) {
            console.error('Error saving groups', e);
        }
    },

    saveGroup: async (group: PlayerGroup): Promise<void> => {
        const groups = await StorageService.getGroups();
        const index = groups.findIndex(g => g.id === group.id);
        let updatedGroups;
        if (index >= 0) {
            updatedGroups = [...groups];
            updatedGroups[index] = group;
        } else {
            updatedGroups = [...groups, group];
        }
        await StorageService.saveGroups(updatedGroups);
    },

    deleteGroup: async (groupId: string): Promise<void> => {
        const groups = await StorageService.getGroups();
        const updatedGroups = groups.filter(g => g.id !== groupId);
        await StorageService.saveGroups(updatedGroups);
    },

    addPlayerToGroup: async (groupId: string, playerId: string): Promise<void> => {
        const groups = await StorageService.getGroups();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex >= 0) {
            const group = groups[groupIndex];
            if (!group.playerIds.includes(playerId)) {
                const updatedGroup = { ...group, playerIds: [...group.playerIds, playerId] };
                const updatedGroups = [...groups];
                updatedGroups[groupIndex] = updatedGroup;
                await StorageService.saveGroups(updatedGroups);
            }
        }
    },
};
