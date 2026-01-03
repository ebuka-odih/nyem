import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    FlatList,
    Modal,
    TouchableWithoutFeedback,
    Platform,
    Linking,
} from 'react-native';
import { COLORS, CONDITIONS } from '../constants/colors';
import { ENDPOINTS } from '../constants/endpoints';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { useCategoriesAndLocations } from '../hooks/useCategoriesAndLocations';

export default function UploadItemScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [condition, setCondition] = useState('');
    const [lookingFor, setLookingFor] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [pickerType, setPickerType] = useState<'category' | 'condition' | null>(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string | null>(null);
    const { token } = useAuth();
    const { categories } = useCategoriesAndLocations();
    const conditionLabel = CONDITIONS.find((c) => c.value === condition)?.label || 'Select condition';

    const pickImage = async () => {
        try {
            // Request camera permissions (Expo will show system dialog if needed)
            const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();

            // Handle permission denial
            if (status !== 'granted') {
                // If permission was permanently denied, guide user to settings
                if (!canAskAgain && Platform.OS !== 'web') {
                    Alert.alert(
                        'Camera Permission Required',
                        'Camera permission has been denied. Please enable it in your device settings to take photos.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Open Settings',
                                onPress: () => {
                                    if (Platform.OS === 'ios') {
                                        Linking.openURL('app-settings:');
                                    } else {
                                        Linking.openSettings();
                                    }
                                },
                            },
                        ]
                    );
                } else {
                    // User denied temporarily or web
                    Alert.alert(
                        'Camera Permission Required',
                        Platform.OS === 'web'
                            ? 'Please allow camera access in your browser to take photos.'
                            : 'We need camera permissions to take a photo. Please allow camera access when prompted.'
                    );
                }
                return;
            }

            // Launch camera directly for instant snapping (works on mobile and web)
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 5],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                let imageUri = asset.uri;

                // Convert blob URIs to base64 data URIs for web compatibility
                // Blob URIs expire on web when page reloads, so we convert to data URI
                if (Platform.OS === 'web' && imageUri.startsWith('blob:')) {
                    try {
                        // Fetch the blob and convert to base64
                        const response = await fetch(imageUri);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        const base64Promise = new Promise<string>((resolve, reject) => {
                            reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                    resolve(reader.result);
                                } else {
                                    reject(new Error('Failed to convert image to base64'));
                                }
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        imageUri = await base64Promise;
                        console.log('Converted blob URI to base64 data URI for web');
                    } catch (err) {
                        console.error('Failed to convert blob to base64:', err);
                        Alert.alert('Error', 'Failed to process image. Please try again.');
                        return;
                    }
                } else if (Platform.OS === 'web' && !imageUri.startsWith('data:')) {
                    // For web, ensure we have a data URI (not file:// or other schemes)
                    console.warn('Unexpected image URI format on web:', imageUri);
                }

                setPhotos([...photos, imageUri]);
            }
        } catch (err: any) {
            console.error('Camera error', err);
            Alert.alert(
                'Camera Error',
                err?.message || 'Could not open camera. Please make sure your device has a camera and try again.'
            );
        }
    };

    const handlePost = async () => {
        setErrors(null);
        if (!title || !category || !condition || !lookingFor || photos.length === 0) {
            setErrors('Please fill all required fields and add at least one photo');
            return;
        }

        setLoading(true);
        try {
            // Upload images first to get URLs
            let photoUrls: string[] = [];
            try {
                const uploadResponse = await apiFetch(ENDPOINTS.images.uploadMultipleBase64, {
                    method: 'POST',
                    token: token || undefined,
                    body: {
                        images: photos,
                    },
                });
                
                if (uploadResponse.success && uploadResponse.urls && uploadResponse.urls.length > 0) {
                    photoUrls = uploadResponse.urls;
                } else {
                    throw new Error('Failed to upload images. Please try again.');
                }
            } catch (uploadError: any) {
                setErrors(uploadError.message || 'Failed to upload images. Please try again.');
                setLoading(false);
                return;
            }

            // Create item with uploaded image URLs
            await apiFetch(ENDPOINTS.items.create, {
                method: 'POST',
                token: token || undefined,
                body: {
                    title,
                    description,
                    category,
                    condition,
                    photos: photoUrls,
                    looking_for: lookingFor,
                },
            });
            Alert.alert('Success', 'Item posted successfully!');
            setTitle('');
            setDescription('');
            setCategory('');
            setCondition('');
            setLookingFor('');
            setPhotos([]);
        } catch (error: any) {
            setErrors(error?.message || 'Could not upload item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <Text style={styles.title}>Upload Item</Text>
                <Text style={styles.subtitle}>What would you like to trade?</Text>

                <View style={styles.photoSection}>
                    <Text style={styles.label}>Photos * (Camera Only)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {photos.map((photo, index) => (
                            <View key={index} style={styles.photoItem}>
                                <Image source={{ uri: photo }} style={styles.photo} />
                                <TouchableOpacity
                                    style={styles.removePhoto}
                                    onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                                >
                                    <Ionicons name="close-circle" size={24} color={COLORS.accentError} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {photos.length < 5 && (
                            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
                                <Ionicons name="camera" size={32} color={COLORS.textSecondary} />
                                <Text style={styles.addPhotoText}>Take Photo</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., iPhone 13 Pro"
                        placeholderTextColor={COLORS.textSecondary}
                        value={title}
                        onChangeText={setTitle}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Describe your item..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Category *</Text>
                    <TouchableOpacity
                        style={[
                            styles.selector,
                            pickerVisible && pickerType === 'category' && styles.selectorActive,
                        ]}
                        onPress={() => {
                            setPickerType('category');
                            setPickerVisible(true);
                        }}
                    >
                        <Text style={[styles.selectorText, !category && styles.placeholder]}>
                            {category || 'Select category'}
                        </Text>
                        <Ionicons
                            name={pickerVisible && pickerType === 'category' ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={pickerVisible && pickerType === 'category' ? COLORS.primary : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Condition *</Text>
                    <TouchableOpacity
                        style={[
                            styles.selector,
                            pickerVisible && pickerType === 'condition' && styles.selectorActive,
                        ]}
                        onPress={() => {
                            setPickerType('condition');
                            setPickerVisible(true);
                        }}
                    >
                        <Text style={[styles.selectorText, !condition && styles.placeholder]}>
                            {condition ? conditionLabel : 'Select condition'}
                        </Text>
                        <Ionicons
                            name={pickerVisible && pickerType === 'condition' ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color={pickerVisible && pickerType === 'condition' ? COLORS.primary : COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Looking For *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What do you want in exchange?"
                        placeholderTextColor={COLORS.textSecondary}
                        value={lookingFor}
                        onChangeText={setLookingFor}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.postButton, loading && styles.postButtonDisabled]}
                    onPress={handlePost}
                    disabled={loading}
                >
                    <Text style={styles.postButtonText}>
                        {loading ? 'Posting...' : 'Post Item'}
                    </Text>
                </TouchableOpacity>
                {errors && <Text style={styles.errorText}>{errors}</Text>}
            </View>

            <Modal
                animationType="fade"
                transparent
                visible={pickerVisible}
                onRequestClose={() => setPickerVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalCard}>
                                <Text style={styles.modalTitle}>
                                    {pickerType === 'category' ? 'Select category' : 'Select condition'}
                                </Text>
                                <FlatList
                                    data={pickerType === 'category' ? categories : CONDITIONS}
                                    keyExtractor={(item: any) => (typeof item === 'string' ? item : item.value)}
                                    renderItem={({ item }: any) => {
                                        const label = typeof item === 'string' ? item : item.label;
                                        const value = typeof item === 'string' ? item : item.value;
                                        return (
                                            <TouchableOpacity
                                                style={styles.pickerOption}
                                                onPress={() => {
                                                    if (pickerType === 'category') {
                                                        setCategory(label);
                                                    } else {
                                                        setCondition(value);
                                                    }
                                                    setPickerVisible(false);
                                                }}
                                            >
                                                <Text style={styles.pickerOptionText}>{label}</Text>
                                            </TouchableOpacity>
                                        );
                                    }}
                                    nestedScrollEnabled
                                    style={{ maxHeight: 240 }}
                                />
                                <TouchableOpacity
                                    style={styles.modalClose}
                                    onPress={() => setPickerVisible(false)}
                                >
                                    <Text style={styles.modalCloseText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        padding: 20,
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
        marginBottom: 24,
    },
    photoSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    photoItem: {
        marginRight: 12,
        position: 'relative',
    },
    photo: {
        width: 100,
        height: 120,
        borderRadius: 12,
    },
    removePhoto: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
    },
    addPhotoButton: {
        width: 100,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
    },
    addPhotoText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    inputContainer: {
        marginBottom: 20,
        position: 'relative',
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
    textArea: {
        height: 100,
        paddingTop: 14,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        zIndex: 2,
    },
    selectorText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    selectorActive: {
        borderColor: COLORS.primary,
    },
    placeholder: {
        color: COLORS.textSecondary,
    },
    pickerOption: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    pickerOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    postButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    postButtonDisabled: {
        opacity: 0.6,
    },
    postButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        padding: 20,
    },
    modalCard: {
        backgroundColor: COLORS.secondary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalClose: {
        marginTop: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    modalCloseText: {
        color: COLORS.primary,
        fontWeight: '600',
        fontSize: 15,
    },
    errorText: {
        marginTop: 8,
        color: COLORS.accentError,
        textAlign: 'center',
        fontSize: 14,
    },
});
