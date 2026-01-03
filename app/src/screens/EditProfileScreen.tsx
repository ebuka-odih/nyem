import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useCategoriesAndLocations } from '../hooks/useCategoriesAndLocations';

interface EditProfileScreenProps {
    navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
    const { user, refreshUser, updateProfile } = useAuth();
    const { locations } = useCategoriesAndLocations();
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(user?.profile_photo || '');
    const [username, setUsername] = useState(user?.username || '');
    const [city, setCity] = useState(user?.city || 'Lagos');
    const [bio, setBio] = useState(user?.bio || '');
    const [showCityPicker, setShowCityPicker] = useState(false);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permission Required', 'Permission to access camera roll is required!');
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

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile({
                username,
                city,
                bio,
                profile_photo: profilePhoto,
            });
            Alert.alert('Success', 'Profile updated successfully!');
            await refreshUser();
            navigation.goBack();
        } catch (error: any) {
            let errorMessage = 'Failed to update profile';
            
            // Handle specific error cases
            if (error.message) {
                if (error.message.includes('profile_photo') || error.message.includes('too long') || error.message.includes('Data too long')) {
                    errorMessage = 'The profile photo path is too long. Please try selecting a different image.';
                } else if (error.message.includes('username')) {
                    errorMessage = error.message;
                } else {
                    errorMessage = error.message;
                }
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.content}>
                    <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                        <Image
                            source={{
                                uri:
                                    profilePhoto ||
                                    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
                            }}
                            style={styles.profilePhoto}
                        />
                        <View style={styles.photoOverlay}>
                            <Ionicons name="camera" size={24} color={COLORS.secondary} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Enter username"
                                placeholderTextColor={COLORS.textSecondary}
                            />
                            <Text style={styles.hint}>You can change your username once every 24 hours</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>City</Text>
                            <TouchableOpacity
                                style={styles.citySelector}
                                onPress={() => setShowCityPicker(true)}
                            >
                                <Text style={styles.citySelectorText}>{city}</Text>
                                <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell us about yourself"
                                placeholderTextColor={COLORS.textSecondary}
                                multiline
                                numberOfLines={4}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={COLORS.secondary} />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.securityButton}
                            onPress={() => navigation.navigate('UpdatePassword')}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.securityButtonText}>Change Password</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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
        </SafeAreaView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: COLORS.secondary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    content: {
        padding: 20,
    },
    photoContainer: {
        alignSelf: 'center',
        marginBottom: 32,
    },
    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    photoOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: COLORS.background,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    input: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    citySelector: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    citySelectorText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    saveButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    securityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    securityButtonText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.secondary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    cityList: {
        padding: 10,
    },
    cityOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
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
        fontWeight: '600',
        color: COLORS.primary,
    },
});
