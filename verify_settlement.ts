import { GameConfig, GameSession, Player } from './src/types/index';
import { ScoringService } from './src/utils/scoring';
import { SettlementService } from './src/utils/settlement';

// Mock Data
const players: Player[] = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' },
    { id: '4', name: 'David' },
];

const config: GameConfig = {
    buyIn: 5,
    scootPenalty: 25,
    middleScootPenalty: 40,
    maxPenalty: 80,
    eliminationThreshold: 220,
};

const session: GameSession = {
    id: 'test',
    title: 'Test Game',
    players: players,
    config: config,
    rounds: [
        { id: 'r1', scores: [{ playerId: '1', score: 10 }, { playerId: '2', score: 50 }, { playerId: '3', score: 20 }, { playerId: '4', score: 100 }], timestamp: 0 },
        { id: 'r2', scores: [{ playerId: '1', score: 0 }, { playerId: '2', score: 200 }, { playerId: '3', score: 10 }, { playerId: '4', score: 150 }], timestamp: 0 }, // Bob eliminated (250 > 220), David eliminated (250 > 220)
    ],
    eliminatedPlayerIds: ['2', '4'],
    rebuys: {},
    isActive: true,
    startTime: 0,
};

// Test Scoring
const totals = ScoringService.calculateTotalScores(session);
console.log('Totals:', totals);

// Test Rankings
const rankings = ScoringService.getRankings(session);
console.log('Rankings:', rankings);

// Test Settlement (Scenario A: 4 players)
// Pot = 4 * 5 = 20
// 1st Place (Alice, 10): Remainder
// 2nd Place (Charlie, 30): Refund $5
// 3rd Place (David, 250): $0
// 4th Place (Bob, 250): $0
// Payouts: Charlie $5, Alice $15.
// Net: Charlie 0, Alice +10, David -5, Bob -5.

const settlements = SettlementService.calculateSettlements(session);
console.log('Settlements:', settlements);

// Test Transfers
// Debtors: David (-5), Bob (-5)
// Creditors: Alice (+10)
// Transfers: David -> Alice $5, Bob -> Alice $5.

const transfers = SettlementService.calculateTransfers(settlements);
console.log('Transfers:', transfers);

// Verify
const alice = settlements.find(s => s.playerId === '1');
const charlie = settlements.find(s => s.playerId === '3');
const david = settlements.find(s => s.playerId === '4');
const bob = settlements.find(s => s.playerId === '2');

if (alice?.amount === 10 && charlie?.amount === 0 && david?.amount === -5 && bob?.amount === -5) {
    console.log('✅ Settlement Calculation Correct');
} else {
    console.error('❌ Settlement Calculation Failed');
}

if (transfers.length === 2 && transfers[0].to === '1' && transfers[1].to === '1') {
    console.log('✅ Transfers Correct');
} else {
    console.error('❌ Transfers Failed');
}
