import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AboutScreen from './src/screens/AboutScreen';
import GameConfigScreen from './src/screens/GameConfigScreen';
import GroupSelectionScreen from './src/screens/GroupSelectionScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import HomeScreen from './src/screens/HomeScreen';
import PlayerSelectionScreen from './src/screens/PlayerSelectionScreen';
import RankingGameTypeScreen from './src/screens/RankingGameTypeScreen';
import RankingGroupSelectScreen from './src/screens/RankingGroupSelectScreen';
import RankingLeaderboardScreen from './src/screens/RankingLeaderboardScreen';
import ScoreboardScreen from './src/screens/ScoreboardScreen';
import SettlementScreen from './src/screens/SettlementScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Home">
                        <Stack.Screen
                            name="Home"
                            component={HomeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="GroupSelection"
                            component={GroupSelectionScreen}
                            options={{ title: 'Select Group', headerShown: false }}
                        />
                        <Stack.Screen
                            name="PlayerSelection"
                            component={PlayerSelectionScreen}
                            options={{ title: 'Select Players', headerShown: false }}
                        />
                        <Stack.Screen
                            name="GameConfig"
                            component={GameConfigScreen}
                            options={{ title: 'Game Setup' }}
                        />
                        <Stack.Screen
                            name="Scoreboard"
                            component={ScoreboardScreen}
                            options={{ title: 'Scoreboard', headerShown: false }}
                        />
                        <Stack.Screen
                            name="Settlement"
                            component={SettlementScreen}
                            options={{ title: 'Settlement' }}
                        />
                        <Stack.Screen
                            name="History"
                            component={HistoryScreen}
                            options={{ title: 'Game History', headerShown: false }}
                        />
                        <Stack.Screen
                            name="RankingGameType"
                            component={RankingGameTypeScreen}
                            options={{ title: 'Rankings', headerShown: false }}
                        />
                        <Stack.Screen
                            name="RankingGroupSelect"
                            component={RankingGroupSelectScreen}
                            options={{ title: 'Select Group', headerShown: false }}
                        />
                        <Stack.Screen
                            name="RankingLeaderboard"
                            component={RankingLeaderboardScreen}
                            options={{ title: 'Leaderboard', headerShown: false }}
                        />
                        <Stack.Screen
                            name="About"
                            component={AboutScreen}
                            options={{ title: 'About', headerShown: false }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
