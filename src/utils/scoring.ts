import { GameConfig, GameSession } from '../types';

export const ScoringService = {
    calculateTotalScores: (session: GameSession): Record<string, number> => {
        const totals: Record<string, number> = {};

        // Initialize with 0
        session.players.forEach(p => {
            totals[p.id] = 0;
        });

        // Sum up rounds
        session.rounds.forEach(round => {
            round.scores.forEach(score => {
                if (totals[score.playerId] !== undefined) {
                    totals[score.playerId] += score.score;
                }
            });
        });

        return totals;
    },

    checkElimination: (totalScore: number, config: GameConfig): boolean => {
        return totalScore > config.eliminationThreshold;
    },

    calculatePotSize: (session: GameSession): number => {
        const initialPot = session.players.length * session.config.buyIn;
        let rebuyPot = 0;

        Object.values(session.rebuys).forEach(count => {
            rebuyPot += count * session.config.buyIn;
        });

        return initialPot + rebuyPot;
    },

    getRankings: (session: GameSession): { playerId: string; totalScore: number; rank: number }[] => {
        const totals = ScoringService.calculateTotalScores(session);

        // Sort players by score (ascending is better in Rummy usually? No, user said "Winner: 0 points", so lower is better)
        // "Elimination Threshold: Default >220 points (Player is out if they score 221 or higher)."
        // So yes, lower score is better.

        // However, for ranking, we need to consider eliminated players too.
        // Active players are ranked by score (asc).
        // Eliminated players are ranked below active players.
        // AND Eliminated players should be ranked by how long they survived (Rounds Played).

        const activePlayers = session.players.filter(p => !session.eliminatedPlayerIds.includes(p.id));
        const eliminatedPlayers = session.players.filter(p => session.eliminatedPlayerIds.includes(p.id));

        const rankedActive = activePlayers
            .map(p => ({ playerId: p.id, totalScore: totals[p.id], rank: 0 }))
            .sort((a, b) => a.totalScore - b.totalScore);

        // Helper to count rounds played
        const getRoundsPlayed = (playerId: string) => {
            return session.rounds.filter(r => r.scores.some(s => s.playerId === playerId)).length;
        };

        // Eliminated players sorted by Rounds Played (Desc) -> Then Score (Asc)
        const rankedEliminated = eliminatedPlayers
            .map(p => ({
                playerId: p.id,
                totalScore: totals[p.id],
                rank: 0,
                roundsPlayed: getRoundsPlayed(p.id)
            }))
            .sort((a, b) => {
                // Primary: Rounds Played (Descending) - More rounds means survived longer
                if (b.roundsPlayed !== a.roundsPlayed) {
                    return b.roundsPlayed - a.roundsPlayed;
                }
                // Secondary: Total Score (Ascending) - Lower score is better among those eliminated in same round
                return a.totalScore - b.totalScore;
            });

        let rank = 1;
        const finalRankings: { playerId: string; totalScore: number; rank: number }[] = [];

        rankedActive.forEach(p => {
            finalRankings.push({ ...p, rank: rank++ });
        });

        rankedEliminated.forEach(p => {
            // Remove roundsPlayed from final object to match return type
            const { roundsPlayed, ...rest } = p;
            finalRankings.push({ ...rest, rank: rank++ });
        });

        return finalRankings;
    }
};
