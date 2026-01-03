import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ApiUser } from '../types';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { useAuth } from '../contexts/AuthContext';

type UserProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UserProfile'>;

interface Props {
    route: UserProfileScreenRouteProp;
    navigation: UserProfileScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const PLACEHOLDER_AVATAR = 'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';

export default function UserProfileScreen({ route, navigation }: Props) {
    const { userId, user: initialUser } = route.params;
    const { token } = useAuth();
    const [user, setUser] = useState<ApiUser | null>(initialUser || null);
    const [loading, setLoading] = useState(!initialUser);
    const [stats, setStats] = useState({
        trades: 0,
        reviews: 0,
        rating: 0,
    });

    useEffect(() => {
        if (!user && userId) {
            fetchUserProfile();
        }
        // Mock stats for now
        setStats({
            trades: Math.floor(Math.random() * 50),
            reviews: Math.floor(Math.random() * 20),
            rating: (4 + Math.random()).toFixed(1) as any,
        });
    }, [userId]);

    const fetchUserProfile = async () => {
        try {
            // If we have a specific endpoint for fetching another user's profile, use it.
            // For now, we might rely on the passed user object or fetch if needed.
            // Assuming we might need to fetch if only ID is passed.
            // const res = await apiFetch(`${ENDPOINTS.users}/${userId}`, { token });
            // setUser(res.user);
            setLoading(false);
        } catch (error) {
            console.warn('Failed to fetch user profile', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>User not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={{ uri: user.profile_photo || PLACEHOLDER_AVATAR }}
                    style={styles.coverImage}
                    blurRadius={10}
                />
                <View style={styles.headerContent}>
                    <Image
                        source={{ uri: user.profile_photo || PLACEHOLDER_AVATAR }}
                        style={styles.avatar}
                    />
                    <Text style={styles.username}>{user.username}</Text>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.locationText}>{user.city || 'Unknown Location'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.trades}</Text>
                    <Text style={styles.statLabel}>Trades</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.reviews}</Text>
                    <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.statValue}>{stats.rating}</Text>
                        <Ionicons name="star" size={16} color="#FFD700" style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>
                    {user.bio || `Hi, I'm ${user.username}! I love trading items on Nyem.`}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Reviews</Text>
                <View style={styles.comingSoonCard}>
                    <Ionicons name="time-outline" size={32} color={COLORS.textSecondary} />
                    <Text style={styles.comingSoonText}>Reviews coming soon!</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    errorText: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    coverImage: {
        width: '100%',
        height: 150,
        opacity: 0.6,
        backgroundColor: COLORS.primary,
    },
    headerContent: {
        alignItems: 'center',
        marginTop: -50,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: COLORS.background,
        backgroundColor: COLORS.secondary,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 12,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    locationText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        marginHorizontal: 20,
        paddingVertical: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.border,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    bioText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    comingSoonCard: {
        backgroundColor: COLORS.secondary,
        padding: 30,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    comingSoonText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});
