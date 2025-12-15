export interface Player {
    id: string;
    name: string;
    alias?: string;
}

export interface PlayerGroup {
    id: string;
    name: string;
    playerIds: string[];
}

export interface GameConfig {
    buyIn: number;
    scootPenalty: number;
    middleScootPenalty: number;
    maxPenalty: number;
    eliminationThreshold: number;
    numWinners: number;
}

export interface RoundScore {
    playerId: string;
    score: number;
}

export interface GameRound {
    id: string;
    scores: RoundScore[];
    timestamp: number;
}

export type GameType = 'RUMMY' | 'UNO';

export interface GameSession {
    id: string;
    title: string; // e.g., "Rummy-2025-12-01..."
    players: Player[];
    config: GameConfig;
    rounds: GameRound[];
    eliminatedPlayerIds: string[];
    rebuys: Record<string, number>; // playerId -> count
    isActive: boolean;
    startTime: number;
    endTime?: number;
    type: GameType;
    groupId?: string;
}

export interface Settlement {
    playerId: string;
    amount: number; // Positive = Receive, Negative = Pay (though usually we just show winnings)
    rank: number;
    netTransfer?: number; // For "Who owes Whom" logic
}

export interface SettlementSnapshot {
    id: string; // Unique ID for the snapshot
    sessionId: string;
    gameTitle: string;
    gameType: GameType;
    date: number;
    potSize: number;
    settlements: Settlement[]; // The calculated settlements
    transfers: { from: string; to: string; amount: number }[]; // Who owes whom
    status?: 'PAID' | 'UNPAID'; // Default UNPAID
}

export interface PlayerStats {
    playerId: string;
    playerName: string;
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    hatTricks: number;
    roundsWon: number;
    totalPodiums: number;
    totalMatches: number;
}
