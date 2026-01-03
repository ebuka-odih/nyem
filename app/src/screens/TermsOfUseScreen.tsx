import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { GradientLayout } from '../components/GradientLayout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TermsOfUseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TermsOfUse'>;

interface Props {
    navigation: TermsOfUseScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function TermsOfUseScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <GradientLayout showBackButton={true}>
            <View style={styles.wrapper}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.contentContainer,
                        { paddingBottom: 40 + insets.bottom }
                    ]}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    bounces={true}
                    alwaysBounceVertical={false}
                    scrollEnabled={true}
                >
                    <View style={[styles.headerContainer, { paddingTop: 20 + insets.top }]}>
                        <Text style={styles.headerTitle}>Terms of Use</Text>
                        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.sectionText}>
                            By accessing and using Nyem ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </Text>

                        <Text style={styles.sectionTitle}>2. Description of Service</Text>
                        <Text style={styles.sectionText}>
                            Nyem is a mobile application that facilitates item trading and swapping between users. The App allows users to:
                        </Text>
                        <Text style={styles.bulletPoint}>• Upload items they wish to trade</Text>
                        <Text style={styles.bulletPoint}>• Browse and swipe through items available for trade</Text>
                        <Text style={styles.bulletPoint}>• Match with other users interested in trading</Text>
                        <Text style={styles.bulletPoint}>• Communicate with matched users to arrange trades</Text>

                        <Text style={styles.sectionTitle}>3. User Accounts</Text>
                        <Text style={styles.sectionText}>
                            To use Nyem, you must create an account by providing accurate and complete information. You are responsible for:
                        </Text>
                        <Text style={styles.bulletPoint}>• Maintaining the confidentiality of your account credentials</Text>
                        <Text style={styles.bulletPoint}>• All activities that occur under your account</Text>
                        <Text style={styles.bulletPoint}>• Notifying us immediately of any unauthorized use</Text>

                        <Text style={styles.sectionTitle}>4. User Conduct</Text>
                        <Text style={styles.sectionText}>
                            You agree to use Nyem only for lawful purposes and in a way that does not infringe the rights of others. You agree NOT to:
                        </Text>
                        <Text style={styles.bulletPoint}>• Post false, misleading, or fraudulent item listings</Text>
                        <Text style={styles.bulletPoint}>• Upload items that are illegal, stolen, or prohibited</Text>
                        <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
                        <Text style={styles.bulletPoint}>• Use the App for any commercial purposes without authorization</Text>
                        <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to the App or its systems</Text>

                        <Text style={styles.sectionTitle}>5. Item Listings and Trading</Text>
                        <Text style={styles.sectionText}>
                            When listing items on Nyem, you represent and warrant that:
                        </Text>
                        <Text style={styles.bulletPoint}>• You own the item or have the right to trade it</Text>
                        <Text style={styles.bulletPoint}>• The item description is accurate and truthful</Text>
                        <Text style={styles.bulletPoint}>• The item is in the condition you describe</Text>
                        <Text style={styles.sectionText}>
                            Nyem acts as a platform to connect traders. We are not a party to any trade agreement between users. All trades are conducted at your own risk.
                        </Text>

                        <Text style={styles.sectionTitle}>6. Disputes Between Users</Text>
                        <Text style={styles.sectionText}>
                            Nyem is not responsible for resolving disputes between users. We encourage users to communicate clearly and arrange safe, public meeting places for trades. If you encounter issues with another user, please report them through the App's reporting feature.
                        </Text>

                        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
                        <Text style={styles.sectionText}>
                            The App and its original content, features, and functionality are owned by Nyem and are protected by international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, or create derivative works without our permission.
                        </Text>

                        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
                        <Text style={styles.sectionText}>
                            Nyem provides the platform "as is" without warranties of any kind. We are not liable for any damages arising from your use of the App, including but not limited to:
                        </Text>
                        <Text style={styles.bulletPoint}>• Loss of items during trades</Text>
                        <Text style={styles.bulletPoint}>• Disputes between users</Text>
                        <Text style={styles.bulletPoint}>• Technical issues or service interruptions</Text>

                        <Text style={styles.sectionTitle}>9. Termination</Text>
                        <Text style={styles.sectionText}>
                            We reserve the right to terminate or suspend your account and access to the App immediately, without prior notice, for any breach of these Terms of Use.
                        </Text>

                        <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
                        <Text style={styles.sectionText}>
                            We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the App after such modifications constitutes acceptance of the updated terms.
                        </Text>

                        <Text style={styles.sectionTitle}>11. Contact Information</Text>
                        <Text style={styles.sectionText}>
                            If you have any questions about these Terms of Use, please contact us through the App's support feature.
                        </Text>
                    </View>
                </ScrollView>
            </View>
        </GradientLayout>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
        flexGrow: 1,
    },
    headerContainer: {
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 30,
        paddingTop: 30,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 24,
        marginBottom: 12,
    },
    sectionText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginBottom: 12,
    },
    bulletPoint: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
        marginLeft: 16,
        marginBottom: 8,
    },
});

