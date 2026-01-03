import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { GradientLayout } from '../components/GradientLayout';

type PhoneLoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PhoneLogin'>;

interface Props {
    navigation: PhoneLoginScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function PhoneLoginScreen({ navigation }: Props) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [lastOtp, setLastOtp] = useState<string | null>(null);
    const { sendOtp } = useAuth();

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert('Invalid Phone Number', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            const res = await sendOtp(phoneNumber);
            setLastOtp(res.debug_code ?? null);
            navigation.navigate('OTPVerification', { phoneNumber });
        } catch (error: any) {
            Alert.alert('OTP Failed', error?.message || 'Could not send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientLayout showBackButton={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Enter your</Text>
                    <Text style={styles.headerSubtitle}>phone number</Text>
                </View>

                <View style={styles.cardContainer}>
                    <Text style={styles.instructionText}>
                        We’ll send a one-time code
                    </Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.phoneInputWrapper}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>+234</Text>
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                placeholder="8012345678"
                                placeholderTextColor="#999"
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                maxLength={10}
                                autoFocus
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                        onPress={handleSendOTP}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.sendButtonText}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.infoText}>
                        Standard SMS rates may apply
                    </Text>
                    {lastOtp && (
                        <Text style={styles.debugCode}>Debug code: {lastOtp}</Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </GradientLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        height: height * 0.25,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    cardContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 30,
        paddingTop: 40,
    },
    instructionText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 28,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
    },
    countryCode: {
        paddingRight: 10,
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
        marginRight: 10,
    },
    countryCodeText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        color: COLORS.textPrimary,
        paddingVertical: 4,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            } as any,
        }),
    },
    sendButton: {
        backgroundColor: '#990033',
        paddingVertical: 20,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#990033',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 5,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 20,
        opacity: 0.7,
    },
    debugCode: {
        fontSize: 12,
        color: '#990033',
        textAlign: 'center',
        marginTop: 12,
        fontWeight: '600',
    },
});
