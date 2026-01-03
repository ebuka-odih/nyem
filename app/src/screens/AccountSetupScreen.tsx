import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
    Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useCategoriesAndLocations } from '../hooks/useCategoriesAndLocations';
import { GradientLayout } from '../components/GradientLayout';

type AccountSetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AccountSetup'>;
type AccountSetupScreenRouteProp = RouteProp<RootStackParamList, 'AccountSetup'>;

interface Props {
    navigation: AccountSetupScreenNavigationProp;
    route: AccountSetupScreenRouteProp;
}

const { width, height } = Dimensions.get('window');

export default function AccountSetupScreen({ navigation, route }: Props) {
    const { phoneNumber } = route.params || { phoneNumber: '' };
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [city, setCity] = useState('Lagos');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { updateProfile } = useAuth();
    const { locations } = useCategoriesAndLocations();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a photo');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes

            // Check file size if available
            if (asset.fileSize && asset.fileSize > maxSize) {
                Alert.alert(
                    'Image Too Large',
                    'The selected image is too large. Please choose an image smaller than 2MB.',
                    [{ text: 'OK' }]
                );
                return;
            }

            setProfilePhoto(asset.uri);
        }
    };

    const handleCitySelect = (selectedCity: string) => {
        setCity(selectedCity);
        setShowCityPicker(false);
    };

    const handleComplete = async () => {
        if (!username.trim()) {
            Alert.alert('Missing info', 'Please choose a username');
            return;
        }
        setLoading(true);
        try {
            await updateProfile({
                username: username.trim(),
                city,
                profile_photo: profilePhoto || undefined,
                password: password || undefined,
            });
            navigation.replace('MainTabs');
        } catch (error: any) {
            Alert.alert('Setup failed', error?.message || 'Could not complete signup');
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
                    <Text style={styles.headerTitle}>Create</Text>
                    <Text style={styles.headerSubtitle}>Account</Text>
                </View>

                <View style={styles.cardContainer}>
                    <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                                <Text style={styles.photoPlaceholderText}>Add photo</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="John Smith"
                                placeholderTextColor="#999"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                            {username.length > 0 && (
                                <Ionicons name="checkmark" size={20} color={COLORS.accentSuccess} />
                            )}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>City</Text>
                        <TouchableOpacity
                            style={styles.inputWrapper}
                            onPress={() => setShowCityPicker(true)}
                        >
                            <Text style={styles.inputText}>{city}</Text>
                            <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
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

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleComplete}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'SIGN UP'}</Text>
                    </TouchableOpacity>
                </View>

                {/* City Picker Modal */}
                <Modal
                    visible={showCityPicker}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowCityPicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select City</Text>
                                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.cityList}>
                                {locations.map((cityName) => (
                                    <TouchableOpacity
                                        key={cityName}
                                        style={[
                                            styles.cityOption,
                                            city === cityName && styles.cityOptionSelected,
                                        ]}
                                        onPress={() => handleCitySelect(cityName)}
                                    >
                                        <Text
                                            style={[
                                                styles.cityOptionText,
                                                city === cityName && styles.cityOptionTextSelected,
                                            ]}
                                        >
                                            {cityName}
                                        </Text>
                                        {city === cityName && (
                                            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </Modal>
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
    photoContainer: {
        alignItems: 'center',
        marginBottom: 30,
        alignSelf: 'center',
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#990033',
    },
    photoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#990033',
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
        justifyContent: 'space-between',
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
    inputText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        paddingVertical: 4,
    },
    button: {
        backgroundColor: '#990033',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    cityList: {
        padding: 12,
    },
    cityOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 14,
        marginVertical: 4,
    },
    cityOptionSelected: {
        backgroundColor: COLORS.primary + '15',
    },
    cityOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    cityOptionTextSelected: {
        fontWeight: '700',
        color: COLORS.primary,
    },
});
