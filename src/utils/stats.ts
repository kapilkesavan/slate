import { GameSession, GameType, Player, PlayerGroup, PlayerStats } from '../types';
import { ScoringService } from './scoring';

export const StatsService = {
    calculatePlayerStats: (
        history: GameSession[],
        players: Player[],
        gameType: GameType,
        targetGroup?: PlayerGroup
    ): PlayerStats[] => {
        const statsMap = new Map<string, PlayerStats>();

        // Initialize stats for players in the target group (or all players if no group specified)
        const relevantPlayers = targetGroup
            ? players.filter(p => targetGroup.playerIds.includes(p.id))
            : players;

        relevantPlayers.forEach(p => {
            statsMap.set(p.id, {
                playerId: p.id,
                playerName: p.name,
                firstPlace: 0,
                secondPlace: 0,
                thirdPlace: 0,
                hatTricks: 0,
                roundsWon: 0,
                totalPodiums: 0,
                totalMatches: 0
            });
        });

        // Filter sessions by Type
        // FIX: If targetGroup is provided, we MUST only include sessions that created specifically for this group.
        // If targetGroup is NOT provided (Global), currently we show all sessions of that type.
        const filteredSessions = history.filter(s => {
            if (s.type !== gameType) return false;

            // Critical Data Scoping Fix:
            if (targetGroup) {
                return s.groupId === targetGroup.id;
            }

            return true;
        });

        filteredSessions.forEach(session => {
            // Check if this session involves any of our relevant players
            // Ideally, we include a session if AT LEAST ONE player from our group was in it?
            // Requirement says: "User Aggregates data from *GameHistory*... selecting a specific Player Group."
            // "Stats for all players in that group."
            // So we process the session, and only update stats for players who exist in statsMap.

            // 1. Get Rankings for this session
            const rankings = ScoringService.getRankings(session);
            const numWinners = session.config.numWinners;

            rankings.forEach(r => {
                const pStats = statsMap.get(r.playerId);
                if (!pStats) return; // Player not in our interest list

                // Increment Total Matches
                pStats.totalMatches++;

                // Update placements
                if (r.rank === 1) {
                    pStats.firstPlace++;
                } else if (r.rank === 2 && numWinners >= 2) {
                    pStats.secondPlace++;
                } else if (r.rank === 3 && numWinners >= 3) {
                    pStats.thirdPlace++;
                }
            });

            // 2. Hat-Tricks & Rounds Won
            // We need to look at rounds for each player
            session.players.forEach(p => {
                const pStats = statsMap.get(p.id);
                if (!pStats) return;

                const playerScores = session.rounds.map(r => {
                    const scoreEntry = r.scores.find(s => s.playerId === p.id);
                    return scoreEntry ? scoreEntry.score : null;
                }).filter((s): s is number => s !== null);

                // Rounds Won (Score == 0)
                let wins = 0;
                playerScores.forEach(s => {
                    if (s === 0) wins++;
                });
                pStats.roundsWon += wins;

                // Hat-tricks (3 consecutive wins)
                // Logic: greedy non-overlapping.
                // e.g. 0, 0, 0, 0, 0, 0 -> 2 hat tricks
                // e.g. 0, 0, 0, 0, 0 -> 1 hat trick
                let consecutiveWins = 0;
                for (let i = 0; i < playerScores.length; i++) {
                    if (playerScores[i] === 0) {
                        consecutiveWins++;
                        if (consecutiveWins === 3) {
                            pStats.hatTricks++;
                            consecutiveWins = 0; // Reset for non-overlapping
                        }
                    } else {
                        consecutiveWins = 0;
                    }
                }
            });
        });

        // Calculate Totals and Convert to Array
        const result: PlayerStats[] = Array.from(statsMap.values()).map(p => ({
            ...p,
            totalPodiums: p.firstPlace + p.secondPlace + p.thirdPlace
        }));

        // Sort by Olympic Style: 1st > 2nd > 3rd > Total Podiums
        return result.sort((a, b) => {
            if (b.firstPlace !== a.firstPlace) return b.firstPlace - a.firstPlace;
            if (b.secondPlace !== a.secondPlace) return b.secondPlace - a.secondPlace;
            if (b.thirdPlace !== a.thirdPlace) return b.thirdPlace - a.thirdPlace;
            return b.totalPodiums - a.totalPodiums;
        });
    }
};
