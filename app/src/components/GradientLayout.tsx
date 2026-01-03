import React from 'react';
import { StyleSheet, ViewStyle, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    children: React.ReactNode;
    style?: ViewStyle;
    showBackButton?: boolean;
}

export const GradientLayout = ({ children, style, showBackButton = false }: Props) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const paddingTop = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || insets.top;

    return (
        <LinearGradient
            colors={['#990033', '#330033']} // Deep red to dark purple/black
            style={[styles.container, style]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {showBackButton && (
                <TouchableOpacity
                    style={[styles.backButton, { top: paddingTop + 10 }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            )}

            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});
