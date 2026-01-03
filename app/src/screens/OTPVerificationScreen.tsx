import React, { useState, useRef } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { GradientLayout } from '../components/GradientLayout';

type OTPVerificationScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'OTPVerification'
>;
type OTPVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

interface Props {
    navigation: OTPVerificationScreenNavigationProp;
    route: OTPVerificationScreenRouteProp;
}

const { width, height } = Dimensions.get('window');

export default function OTPVerificationScreen({ navigation, route }: Props) {
    const { phoneNumber } = route.params || { phoneNumber: '' };
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const { verifyOtp } = useAuth();

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOTP = async () => {
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
            return;
        }

        setLoading(true);

        try {
            const { new_user } = await verifyOtp({ phone: phoneNumber, code: otpCode });
            if (new_user) {
                navigation.navigate('AccountSetup', { phoneNumber });
            } else {
                navigation.navigate('MainTabs');
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', error?.message || 'Could not verify code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = () => {
        Alert.alert('OTP Sent', 'A new verification code has been sent to your phone');
        // TODO: Implement actual resend OTP API call
    };

    return (
        <GradientLayout showBackButton={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Enter</Text>
                    <Text style={styles.headerSubtitle}>verification code</Text>
                </View>

                <View style={styles.cardContainer}>
                    <Text style={styles.instructionText}>
                        We sent a code to +234{phoneNumber}
                    </Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[styles.otpInput, digit && styles.otpInputFilled]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.verifyButtonText}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.altActions}>
                        <TouchableOpacity onPress={handleResendOTP}>
                            <Text style={styles.resendLink}>Resend OTP</Text>
                        </TouchableOpacity>
                    </View>
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
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
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
        textAlign: 'center',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: 0,
    },
    otpInput: {
        width: (width - 60 - 30) / 6, // Total width minus padding and margins, divided by 6
        height: 64,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
        textAlign: 'center',
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginHorizontal: 2.5,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            } as any,
        }),
    },
    otpInputFilled: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(153, 0, 51, 0.08)',
    },
    verifyButton: {
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
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    resendLink: {
        fontSize: 15,
        color: '#990033',
        fontWeight: '600',
    },
    altActions: {
        marginTop: 20,
        gap: 12,
        alignItems: 'center',
    },
});
