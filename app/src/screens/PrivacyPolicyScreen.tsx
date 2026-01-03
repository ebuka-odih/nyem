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

type PrivacyPolicyScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

interface Props {
    navigation: PrivacyPolicyScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function PrivacyPolicyScreen({ navigation }: Props) {
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
                        <Text style={styles.headerTitle}>Privacy Policy</Text>
                        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.sectionText}>
                            At Nyem, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
                        </Text>

                        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                        <Text style={styles.subsectionTitle}>Personal Information</Text>
                        <Text style={styles.sectionText}>
                            When you create an account, we collect:
                        </Text>
                        <Text style={styles.bulletPoint}>• Phone number (for account verification)</Text>
                        <Text style={styles.bulletPoint}>• Username and profile information</Text>
                        <Text style={styles.bulletPoint}>• Profile photo (optional)</Text>
                        <Text style={styles.bulletPoint}>• City/location information</Text>

                        <Text style={styles.subsectionTitle}>Item Information</Text>
                        <Text style={styles.sectionText}>
                            When you list items for trade, we collect:
                        </Text>
                        <Text style={styles.bulletPoint}>• Item photos and descriptions</Text>
                        <Text style={styles.bulletPoint}>• Item category and condition</Text>
                        <Text style={styles.bulletPoint}>• What you're looking for in exchange</Text>

                        <Text style={styles.subsectionTitle}>Usage Information</Text>
                        <Text style={styles.sectionText}>
                            We automatically collect information about how you use the App, including:
                        </Text>
                        <Text style={styles.bulletPoint}>• Swipe interactions and matches</Text>
                        <Text style={styles.bulletPoint}>• Messages sent through the App</Text>
                        <Text style={styles.bulletPoint}>• Device information and app usage patterns</Text>

                        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                        <Text style={styles.sectionText}>
                            We use the information we collect to:
                        </Text>
                        <Text style={styles.bulletPoint}>• Provide and maintain the App's services</Text>
                        <Text style={styles.bulletPoint}>• Verify your identity and prevent fraud</Text>
                        <Text style={styles.bulletPoint}>• Match you with other users based on trading preferences</Text>
                        <Text style={styles.bulletPoint}>• Facilitate communication between matched users</Text>
                        <Text style={styles.bulletPoint}>• Send you important updates and notifications</Text>
                        <Text style={styles.bulletPoint}>• Improve and personalize your experience</Text>
                        <Text style={styles.bulletPoint}>• Monitor and analyze usage patterns</Text>

                        <Text style={styles.sectionTitle}>3. Information Sharing and Disclosure</Text>
                        <Text style={styles.sectionText}>
                            We do not sell your personal information. We may share your information in the following circumstances:
                        </Text>
                        <Text style={styles.subsectionTitle}>With Other Users</Text>
                        <Text style={styles.bulletPoint}>• Your profile information is visible to other users</Text>
                        <Text style={styles.bulletPoint}>• Your item listings are visible to all users in your area</Text>
                        <Text style={styles.bulletPoint}>• When you match with another user, they can see your profile and contact you</Text>

                        <Text style={styles.subsectionTitle}>Service Providers</Text>
                        <Text style={styles.sectionText}>
                            We may share information with third-party service providers who help us operate the App, such as:
                        </Text>
                        <Text style={styles.bulletPoint}>• Cloud hosting services</Text>
                        <Text style={styles.bulletPoint}>• SMS verification services</Text>
                        <Text style={styles.bulletPoint}>• Analytics providers</Text>

                        <Text style={styles.subsectionTitle}>Legal Requirements</Text>
                        <Text style={styles.sectionText}>
                            We may disclose your information if required by law or to protect our rights and the safety of our users.
                        </Text>

                        <Text style={styles.sectionTitle}>4. Data Security</Text>
                        <Text style={styles.sectionText}>
                            We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                        </Text>

                        <Text style={styles.sectionTitle}>5. Your Rights and Choices</Text>
                        <Text style={styles.sectionText}>
                            You have the right to:
                        </Text>
                        <Text style={styles.bulletPoint}>• Access and update your personal information through the App</Text>
                        <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
                        <Text style={styles.bulletPoint}>• Opt out of certain communications</Text>
                        <Text style={styles.bulletPoint}>• Request a copy of your data</Text>

                        <Text style={styles.sectionTitle}>6. Location Information</Text>
                        <Text style={styles.sectionText}>
                            We collect your city/location information to help you find local trading partners. You can update or change your location information at any time in your profile settings.
                        </Text>

                        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
                        <Text style={styles.sectionText}>
                            Nyem is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </Text>

                        <Text style={styles.sectionTitle}>8. Data Retention</Text>
                        <Text style={styles.sectionText}>
                            We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal purposes.
                        </Text>

                        <Text style={styles.sectionTitle}>9. Changes to This Privacy Policy</Text>
                        <Text style={styles.sectionText}>
                            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy in the App and updating the "Last Updated" date. Your continued use of the App after such changes constitutes acceptance of the updated policy.
                        </Text>

                        <Text style={styles.sectionTitle}>10. Contact Us</Text>
                        <Text style={styles.sectionText}>
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through the App's support feature.
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
    subsectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
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

