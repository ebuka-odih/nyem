import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { GradientLayout } from '../components/GradientLayout';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
    navigation: LoginScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: Props) {
    const [usernameOrPhone, setUsernameOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!usernameOrPhone || !password) {
            Alert.alert('Missing info', 'Please enter both username/phone and password.');
            return;
        }
        setLoading(true);
        try {
            await login({ usernameOrPhone, password });
            navigation.replace('MainTabs');
        } catch (error: any) {
            Alert.alert('Login failed', error?.message || 'Could not sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientLayout showBackButton={true}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.headerTitle}>Hello</Text>
                    <Text style={styles.headerSubtitle}>Sign in!</Text>
                </View>

                <View style={styles.cardContainer}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username or Phone</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Joydeo@gmail.com"
                                placeholderTextColor="#999"
                                value={usernameOrPhone}
                                onChangeText={setUsernameOrPhone}
                                autoCapitalize="none"
                            />
                            {usernameOrPhone.length > 0 && (
                                <Ionicons name="checkmark" size={20} color={COLORS.accentSuccess} />
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="•••••••"
                                placeholderTextColor="#999"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'SIGN IN'}</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('PhoneLogin')}>
                            <Text style={styles.footerLink}>Sign up</Text>
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
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#990033', // Dark red label
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        paddingVertical: 4,
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            } as any,
        }),
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 40,
    },
    forgotPasswordText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#990033',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#990033',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 40,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    footerLink: {
        color: '#990033',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
