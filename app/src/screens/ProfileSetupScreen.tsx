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
    Image,
    ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { useCategoriesAndLocations } from '../hooks/useCategoriesAndLocations';

type ProfileSetupScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    'ProfileSetup'
>;

interface Props {
    navigation: ProfileSetupScreenNavigationProp;
}

export default function ProfileSetupScreen({ navigation }: Props) {
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const { token, refreshUser } = useAuth();
    const { locations } = useCategoriesAndLocations();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a photo');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

    const handleComplete = async () => {
        if (!username.trim()) {
            Alert.alert('Missing Information', 'Please enter a username');
            return;
        }

        if (!city) {
            Alert.alert('Missing Information', 'Please select your city');
            return;
        }

        setLoading(true);

        try {
            await apiFetch('/profile/update', {
                method: 'PUT',
                token: token || undefined,
                body: {
                    username: username.trim(),
                    bio: bio.trim(),
                    city,
                    profile_photo: profilePhoto,
                },
            });
            await refreshUser();
            navigation.navigate('MainTabs');
        } catch (error: any) {
            Alert.alert('Update Failed', error?.message || 'Could not save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Text style={styles.title}>Complete your profile</Text>
                    <Text style={styles.subtitle}>
                        Help others know who they're trading with
                    </Text>

                    <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                        {profilePhoto ? (
                            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="camera" size={40} color={COLORS.textSecondary} />
                                <Text style={styles.photoPlaceholderText}>Add Photo</Text>
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={16} color={COLORS.secondary} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your username"
                            placeholderTextColor={COLORS.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Bio (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell us a bit about yourself"
                            placeholderTextColor={COLORS.textSecondary}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>City *</Text>
                        <TouchableOpacity
                            style={styles.citySelector}
                            onPress={() => setShowCityPicker(!showCityPicker)}
                        >
                            <Text style={[styles.citySelectorText, !city && styles.placeholder]}>
                                {city || 'Select your city'}
                            </Text>
                            <Ionicons
                                name={showCityPicker ? 'chevron-up' : 'chevron-down'}
                                size={24}
                                color={COLORS.textSecondary}
                            />
                        </TouchableOpacity>

                        {showCityPicker && (
                            <View style={styles.cityList}>
                                {locations.map((cityOption) => (
                                    <TouchableOpacity
                                        key={cityOption}
                                        style={styles.cityOption}
                                        onPress={() => {
                                            setCity(cityOption);
                                            setShowCityPicker(false);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.cityOptionText,
                                                city === cityOption && styles.cityOptionSelected,
                                            ]}
                                        >
                                            {cityOption}
                                        </Text>
                                        {city === cityOption && (
                                            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.completeButton, loading && styles.completeButtonDisabled]}
                        onPress={handleComplete}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.completeButtonText}>
                            {loading ? 'Creating Profile...' : 'Complete Setup'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 30,
        paddingTop: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 30,
        lineHeight: 24,
    },
    photoContainer: {
        alignSelf: 'center',
        marginBottom: 30,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.secondary,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    bioInput: {
        height: 80,
        paddingTop: 14,
    },
    citySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    citySelectorText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    placeholder: {
        color: COLORS.textSecondary,
    },
    cityList: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: 8,
        maxHeight: 250,
    },
    cityOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cityOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    cityOptionSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    completeButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    completeButtonDisabled: {
        opacity: 0.6,
    },
    completeButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
