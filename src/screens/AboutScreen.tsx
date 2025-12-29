import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZE, SPACING } from '../constants/theme';

const AboutScreen = ({ navigation }: any) => {
    // Dynamic Version: "Slate v1.{buildNumber}"
    // nativeBuildVersion is the build number (e.g., "33")
    // nativeApplicationVersion is the version name (e.g., "1.0.0")
    // Requirement: "Slate v1.{buildNumber}"
    const buildNumber = Application.nativeBuildVersion || '1';
    const versionLabel = `Slate v${Application.nativeApplicationVersion} (Build ${buildNumber})`;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.versionText}>{versionLabel}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.descriptionText}>
                        The ultimate score tracking companion for Rummy, UNO, and card games. Features include real-time score calculation, financial settlements, safe-zone strategy indicators, player history, and global leaderboards.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.copyrightText}>Copyright 2025-2026 @ K7-Labs</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.l,
        paddingVertical: SPACING.m,
        backgroundColor: COLORS.background,
    },
    backButton: {
        padding: SPACING.s,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    content: {
        flexGrow: 1,
        padding: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: SPACING.xxl,
        alignItems: 'center',
    },
    versionText: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: SPACING.l,
    },
    descriptionText: {
        fontSize: FONT_SIZE.m,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        marginTop: 'auto',
        paddingTop: SPACING.xxl,
    },
    copyrightText: {
        fontSize: FONT_SIZE.s,
        color: COLORS.textSecondary,
        opacity: 0.6,
    },
});

export default AboutScreen;
