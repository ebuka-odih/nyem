/**
 * LocationPermissionPrompt Component
 * 
 * Shows a prompt to request location permission when user denies access.
 * Can be used as a fallback when automatic location request fails.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';
import { COLORS } from '../constants/colors';

interface LocationPermissionPromptProps {
    onSkip?: () => void;
    title?: string;
    message?: string;
}

export function LocationPermissionPrompt({ 
    onSkip,
    title = "Location Permission Needed",
    message = "To find nearby users and items, we need your location. You can enable it in your device settings, or continue without location (some features will be limited)."
}: LocationPermissionPromptProps) {
    const { requestLocation, locationPermission } = useLocation();

    const handleRequestLocation = async () => {
        try {
            const success = await requestLocation();
            if (!success && locationPermission === 'denied') {
                // Show instructions to enable in settings
                Alert.alert(
                    'Enable Location Access',
                    'To enable location access:\n\n' +
                    'iOS: Settings > [App Name] > Location\n' +
                    'Android: Settings > Apps > [App Name] > Permissions > Location\n\n' +
                    'Or you can continue without location.',
                    [
                        { text: 'Continue Without Location', style: 'cancel', onPress: onSkip },
                        { text: 'Open Settings', onPress: () => {
                            // On mobile, you'd typically use Linking.openSettings()
                            // For now, just skip
                            onSkip?.();
                        }},
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to request location');
        }
    };

    if (locationPermission === 'granted') {
        return null; // Don't show if permission is already granted
    }

    return (
        <View style={styles.container}>
            <Ionicons name="location-outline" size={48} color={COLORS.primary} style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleRequestLocation}
                >
                    <Text style={styles.primaryButtonText}>Enable Location</Text>
                </TouchableOpacity>
                
                {onSkip && (
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton]}
                        onPress={onSkip}
                    >
                        <Text style={styles.secondaryButtonText}>Skip for Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
    },
    secondaryButtonText: {
        color: COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
});
