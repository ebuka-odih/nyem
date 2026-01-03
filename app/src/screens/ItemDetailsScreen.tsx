import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type ItemDetailsScreenRouteProp = RouteProp<RootStackParamList, 'ItemDetails'>;
type ItemDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ItemDetails'>;

interface Props {
    route: ItemDetailsScreenRouteProp;
    navigation: ItemDetailsScreenNavigationProp;
}

const { width } = Dimensions.get('window');

// Placeholder avatar for testing
const PLACEHOLDER_AVATAR = 'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';

export default function ItemDetailsScreen({ route, navigation }: Props) {
    const { item } = route.params;

    const [activeSlide, setActiveSlide] = useState(0);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slide = Math.ceil(
            event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
        );
        if (slide !== activeSlide) {
            setActiveSlide(slide);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.carouselContainer}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    style={styles.imageCarousel}
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                >
                    {item.photos.map((photo, index) => (
                        <Image key={index} source={{ uri: photo }} style={styles.image} />
                    ))}
                </ScrollView>
                {item.photos.length > 1 && (
                    <View style={styles.paginationContainer}>
                        {item.photos.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    index === activeSlide
                                        ? styles.paginationDotActive
                                        : styles.paginationDotInactive,
                                ]}
                            />
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <View style={styles.conditionBadge}>
                            <Text style={styles.conditionText}>
                                {item.condition.replace('_', ' ')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Looking For</Text>
                    <View style={styles.lookingForCard}>
                        <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
                        <Text style={styles.lookingForText}>{item.looking_for}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Owner</Text>
                    <View style={styles.ownerCard}>
                        <Image
                            source={{ uri: item.owner?.profile_photo || PLACEHOLDER_AVATAR }}
                            style={styles.ownerPhoto}
                        />
                        <View style={styles.ownerInfo}>
                            <View style={styles.usernameContainer}>
                                <Text style={styles.ownerName}>{item.owner?.username}</Text>
                            </View>
                            <View style={styles.locationContainer}>
                                <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.locationText}>{item.city}</Text>
                                {item.distance_km !== null && item.distance_km !== undefined && (
                                    <>
                                        <Text style={styles.locationSeparator}>•</Text>
                                        <Ionicons name="navigate" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.distanceText}>
                                            {item.distance_km < 1
                                                ? `${Math.round(item.distance_km * 1000)}m`
                                                : `${item.distance_km.toFixed(1)}km`
                                            }
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.viewProfileButton}
                            onPress={() => {
                                if (item.owner) {
                                    navigation.navigate('UserProfile', {
                                        userId: item.owner.id,
                                        user: item.owner
                                    });
                                }
                            }}
                        >
                            <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.passButton}>
                        <Ionicons name="close" size={24} color={COLORS.accentError} />
                        <Text style={styles.passButtonText}>Pass</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.interestedButton}>
                        <Ionicons name="heart" size={24} color={COLORS.secondary} />
                        <Text style={styles.interestedButtonText}>Interested</Text>
                    </TouchableOpacity>
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
    imageCarousel: {
        height: 400,
    },
    carouselContainer: {
        position: 'relative',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
    paginationDotActive: {
        width: 24,
        backgroundColor: COLORS.primary,
    },
    paginationDotInactive: {
        width: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    image: {
        width,
        height: 400,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    titleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
    },
    conditionBadge: {
        backgroundColor: COLORS.accentSuccess,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.secondary,
        textTransform: 'capitalize',
    },
    categoryBadge: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    lookingForCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    lookingForText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: 12,
        flex: 1,
    },
    ownerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    ownerPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    ownerInfo: {
        flex: 1,
    },
    usernameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    ownerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    locationSeparator: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginHorizontal: 4,
    },
    distanceText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: 2,
    },
    viewProfileButton: {
        padding: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        marginBottom: 20,
    },
    passButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.secondary,
        paddingVertical: 14,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.accentError,
        gap: 8,
    },
    passButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.accentError,
    },
    interestedButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 24,
        gap: 8,
    },
    interestedButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
});
