import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'items' | 'settings';

export default function ProfileScreen({ navigation }: { navigation: any }) {
    const { user, logout, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('items');
    const profilePhoto =
        user?.profile_photo ||
        'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';
    const myItems = (user as any)?.items ?? [];

    // Refresh user data when screen is focused
    useFocusEffect(
        useCallback(() => {
            refreshUser();
        }, [refreshUser])
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Image
                        source={{ uri: profilePhoto }}
                        style={styles.profilePhoto}
                    />
                    <Text style={styles.username}>{user?.username || 'Anonymous'}</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.location}>{user?.city || 'City'}</Text>
                    </View>
                    {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('EditProfile')}
                    >
                        <Ionicons name="pencil" size={18} color={COLORS.secondary} />
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Bar */}
                <View style={styles.tabBar}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'items' && styles.activeTab]}
                        onPress={() => setActiveTab('items')}
                    >
                        <Text style={[styles.tabText, activeTab === 'items' && styles.activeTabText]}>
                            My Items
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
                        onPress={() => setActiveTab('settings')}
                    >
                        <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
                            Settings
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                {activeTab === 'items' && (
                    <View style={styles.section}>
                        {myItems.length > 0 ? (
                            <View style={styles.itemsGrid}>
                                {myItems.map((item: any) => (
                                    <View key={item.id} style={styles.itemCard}>
                                        <Image source={{ uri: item.photos?.[0] || profilePhoto }} style={styles.itemPhoto} />
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
                                <Text style={styles.emptyStateText}>No items yet</Text>
                                <Text style={styles.emptyStateSubtext}>
                                    Start trading by uploading your first item
                                </Text>
                                <TouchableOpacity
                                    style={styles.uploadButton}
                                    onPress={() => navigation.navigate('UploadItem')}
                                >
                                    <Ionicons name="add-circle" size={20} color={COLORS.secondary} />
                                    <Text style={styles.uploadButtonText}>Upload Your First Item</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'settings' && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Ionicons name="settings-outline" size={24} color={COLORS.textPrimary} />
                            <Text style={styles.menuItemText}>Settings</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="help-circle-outline" size={24} color={COLORS.textPrimary} />
                            <Text style={styles.menuItemText}>Help & Support</Text>
                            <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={logout}>
                            <Ionicons name="log-out-outline" size={24} color={COLORS.accentError} />
                            <Text style={[styles.menuItemText, { color: COLORS.accentError }]}>
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
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
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.secondary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    location: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    bio: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    editButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 20,
        paddingTop: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        marginHorizontal: 4,
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    itemsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    itemCard: {
        width: '48%',
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        overflow: 'hidden',
    },
    itemPhoto: {
        width: '100%',
        height: 120,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        padding: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: 16,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 25,
        gap: 8,
    },
    uploadButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
});
