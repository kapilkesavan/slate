import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, SHADOWS, SPACING } from '../constants/theme';

// Define navigation types locally for now or move to types/navigation.ts later
type RootStackParamList = {
    Home: undefined;
    GroupSelection: { gameType: 'RUMMY' | 'UNO' };
    PlayerSelection: undefined;
    GameConfig: undefined;
    History: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                <Animated.View entering={FadeInDown.delay(100).duration(1000).springify()} style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/slate-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.subtitle}>Score Tracker & Settlement</Text>
                </Animated.View>

                <View style={styles.buttonContainer}>
                    <Animated.View entering={FadeInUp.delay(300).duration(1000).springify()}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => navigation.navigate('GroupSelection', { gameType: 'RUMMY' })}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Play Rummy</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(500).duration(1000).springify()}>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => navigation.navigate('GroupSelection', { gameType: 'UNO' })}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Play UNO</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(700).duration(1000).springify()}>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => alert('Coming soon!')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryButtonText}>Play Others</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(900).duration(1000).springify()}>
                        <TouchableOpacity
                            style={styles.historyButton}
                            onPress={() => navigation.navigate('History')}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.historyButtonText}>History</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.l,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    logo: {
        width: 240,
        height: 240,
    },
    subtitle: {
        fontSize: FONT_SIZE.l,
        color: COLORS.textSecondary,
        marginTop: SPACING.s,
        textAlign: 'center',
        letterSpacing: 1,
    },
    buttonContainer: {
        width: '100%',
        gap: SPACING.m,
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.m,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    buttonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.m,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.m,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    historyButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: SPACING.m,
        borderRadius: 16,
        alignItems: 'center',
        ...SHADOWS.medium,
        marginTop: SPACING.s, // Add some extra separation
    },
    historyButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.m,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default HomeScreen;
