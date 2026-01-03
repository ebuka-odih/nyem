import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { GradientLayout } from '../components/GradientLayout';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

interface Props {
    navigation: WelcomeScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
    return (
        <GradientLayout>
            <View style={styles.headerContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>N</Text>
                </View>
                <Text style={styles.appName}>Nyem</Text>
                <Text style={styles.headlineTop}>Shop. Find Artisans. Swap Items.</Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.taglineContainer}>
                    <Text style={styles.subtitle}>
                        Discover items, artisans, and swap opportunities around you — all in one place.
                    </Text>
                </View>

                <View style={styles.featuresContainer}>
                    <View style={styles.feature}>
                        <View style={styles.featureIcon}>
                            <Text style={styles.featureEmoji}>🛍</Text>
                        </View>
                        <Text style={styles.featureText}>Shop: Great deals near you</Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureIcon}>
                            <Text style={styles.featureEmoji}>💼</Text>
                        </View>
                        <Text style={styles.featureText}>Services: Book trusted artisans</Text>
                    </View>

                    <View style={styles.feature}>
                        <View style={styles.featureIcon}>
                            <Text style={styles.featureEmoji}>🔁</Text>
                        </View>
                        <Text style={styles.featureText}>Swap: Trade items effortlessly</Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.continueButtonText}>Start Exploring</Text>
                    </TouchableOpacity>

                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                            By continuing, you agree to our{' '}
                        </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TermsOfUse')}>
                            <Text style={styles.termsLink}>Terms of Use</Text>
                        </TouchableOpacity>
                        <Text style={styles.termsText}> and </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                            <Text style={styles.termsLink}>Privacy Policy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </GradientLayout>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        height: height * 0.30, // Reduced from 0.35
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    logoCircle: {
        width: 64, // Reduced from 80
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoText: {
        fontSize: 32, // Reduced from 40
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    appName: {
        fontSize: 28, // Reduced from 32
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginBottom: 4,
    },
    headlineTop: {
        fontSize: 16, // Reduced from 18
        color: '#FFFFFF',
        marginTop: 4,
        fontWeight: '600',
        letterSpacing: 0.5,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
        opacity: 0.9,
    },
    cardContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40, // Increased bottom padding
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
    },
    taglineContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 17, // Increased from 15
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 25, // Increased line height for better readability
        paddingHorizontal: 10,
        fontWeight: '400',
    },
    featuresContainer: {
        width: '100%',
        marginBottom: 10, // Reduced slightly
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8F8F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureEmoji: {
        fontSize: 20,
    },
    featureText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: '600',
        flex: 1,
    },
    noteContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    noteText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    buttonContainer: {
        marginTop: 32, // Fixed spacing instead of auto
        paddingBottom: 10,
    },
    continueButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 100,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    termsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    termsLink: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
        textDecorationLine: 'underline',
        lineHeight: 20,
    },
});
