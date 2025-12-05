import { GameSession, Settlement } from '../types';
import { ScoringService } from './scoring';

export const SettlementService = {
    calculateSettlements: (session: GameSession): Settlement[] => {
        const rankings = ScoringService.getRankings(session);
        const potSize = ScoringService.calculatePotSize(session);
        const playerCount = session.players.length;
        const buyIn = session.config.buyIn;

        // Initialize settlements map
        const settlements: Record<string, Settlement> = {};
        rankings.forEach(r => {
            settlements[r.playerId] = {
                playerId: r.playerId,
                amount: 0, // Net amount (Winnings - BuyIn - Rebuys)
                rank: r.rank,
            };
        });

        // Calculate Payouts based on Rank
        // Scenario A (<= 5 Players)
        // 1st: Remaining Pot
        // 2nd: Refund Buy-in ($5)

        // Scenario B (>= 6 Players)
        // 1st: Remaining Pot
        // 2nd: Double Buy-in ($10)
        // 3rd: Refund Buy-in ($5)

        // Note: "Remaining Pot" means Pot - Other Payouts.

        let firstPlaceId = rankings.find(r => r.rank === 1)?.playerId;
        let secondPlaceId = rankings.find(r => r.rank === 2)?.playerId;
        let thirdPlaceId = rankings.find(r => r.rank === 3)?.playerId;

        let payouts: Record<string, number> = {}; // Amount RECEIVED from Pot

        // Default numWinners logic if not present in config (backward compatibility)
        const numWinners = session.config.numWinners || (playerCount >= 6 ? 3 : playerCount >= 4 ? 2 : 1);

        if (numWinners === 1) {
            if (firstPlaceId) {
                payouts[firstPlaceId] = potSize;
            }
        } else if (numWinners === 2) {
            if (secondPlaceId) {
                payouts[secondPlaceId] = buyIn;
            }
            if (firstPlaceId) {
                const secondPayout = secondPlaceId ? (payouts[secondPlaceId] || 0) : 0;
                payouts[firstPlaceId] = Math.max(0, potSize - secondPayout);
            }
        } else {
            // 3 or more winners
            if (thirdPlaceId) {
                payouts[thirdPlaceId] = buyIn;
            }
            if (secondPlaceId) {
                payouts[secondPlaceId] = buyIn * 2;
            }
            if (firstPlaceId) {
                const secondPayout = secondPlaceId ? (payouts[secondPlaceId] || 0) : 0;
                const thirdPayout = thirdPlaceId ? (payouts[thirdPlaceId] || 0) : 0;
                payouts[firstPlaceId] = Math.max(0, potSize - secondPayout - thirdPayout);
            }
        }

        // Calculate Net Amount for each player
        // Net = Payout - Total Invested (Initial Buy-in + Rebuys)

        session.players.forEach(player => {
            const payout = payouts[player.id] || 0;
            const rebuys = session.rebuys[player.id] || 0;
            const totalInvested = buyIn + (rebuys * buyIn);

            if (settlements[player.id]) {
                settlements[player.id].amount = payout - totalInvested;
            }
        });

        return Object.values(settlements).sort((a, b) => a.rank - b.rank);
    },

    calculateTransfers: (settlements: Settlement[]): { from: string; to: string; amount: number }[] => {
        // Deep copy to avoid mutating original
        const balances = settlements.map(s => ({ ...s }));
        const transfers: { from: string; to: string; amount: number }[] = [];

        // Separate into debtors (negative) and creditors (positive)
        // We need to settle debts.
        // Simple greedy algorithm: match biggest debtor with biggest creditor.

        // Note: Sum of balances should be 0.

        let debtors = balances.filter(s => s.amount < 0).sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
        let creditors = balances.filter(s => s.amount > 0).sort((a, b) => b.amount - a.amount); // Descending (most positive first)

        let dIndex = 0;
        let cIndex = 0;

        while (dIndex < debtors.length && cIndex < creditors.length) {
            const debtor = debtors[dIndex];
            const creditor = creditors[cIndex];

            const debtAmount = Math.abs(debtor.amount);
            const creditAmount = creditor.amount;

            const transferAmount = Math.min(debtAmount, creditAmount);

            if (transferAmount > 0) {
                transfers.push({
                    from: debtor.playerId,
                    to: creditor.playerId,
                    amount: parseFloat(transferAmount.toFixed(2)),
                });
            }

            // Update balances
            debtor.amount += transferAmount;
            creditor.amount -= transferAmount;

            // Move indices if settled (using a small epsilon for float comparison)
            if (Math.abs(debtor.amount) < 0.01) dIndex++;
            if (Math.abs(creditor.amount) < 0.01) cIndex++;
        }

        return transfers;
    }
};
