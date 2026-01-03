import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    Platform,
    Pressable,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, Item } from '../types';
import { COLORS } from '../constants/colors';
import { useCategoriesAndLocations } from '../hooks/useCategoriesAndLocations';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

type SwipeFeedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
    navigation: SwipeFeedScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');
const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80';
const PLACEHOLDER_AVATAR = 'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';
export default function SwipeFeedScreen({ navigation }: Props) {
    const { token, user } = useAuth();
    const { categories, locations } = useCategoriesAndLocations();
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const swiperRef = useRef<Swiper<Item>>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [allCardsSwiped, setAllCardsSwiped] = useState(false);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUser, setMatchedUser] = useState<any>(null);
    const [itemSelectionModalVisible, setItemSelectionModalVisible] = useState(false);
    const [pendingSwipeItem, setPendingSwipeItem] = useState<Item | null>(null);
    const [userItems, setUserItems] = useState<Item[]>([]);
    const isProcessingSwipeRef = useRef(false);
    const isGestureSwipeRef = useRef(false); // Track if current swipe was from gesture
    const previousIndexRef = useRef<number | null>(null); // Track previous index before gesture swipe
    const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!token) return;
        loadFeed();
        loadUserItems();
    }, [token, selectedCategory, selectedCity]);

    // Refresh user items when screen comes into focus (e.g., after uploading an item)
    useFocusEffect(
        useCallback(() => {
            if (token) {
                loadUserItems();
            }
        }, [token])
    );

    const loadUserItems = async () => {
        try {
            const res = await apiFetch(ENDPOINTS.profile.me, { token: token || undefined });
            const items = (res.user as any)?.items || [];
            const mappedItems = items.map((apiItem: any) => mapApiItemToUi(apiItem));
            setUserItems(mappedItems.filter((item: Item) => item.status === 'active'));
        } catch (error) {
            console.warn('Failed to load user items', error);
        }
    };

    const loadFeed = async () => {
        setLoading(true);
        try {
            let feedUrl = ENDPOINTS.items.feed;
            const params: string[] = [];

            if (selectedCategory) {
                params.push(`category=${encodeURIComponent(selectedCategory)}`);
            }

            if (selectedCity) {
                if (selectedCity === 'all') {
                    params.push('city=all');
                } else {
                    params.push(`city=${encodeURIComponent(selectedCity)}`);
                }
            }

            if (params.length > 0) {
                feedUrl += `?${params.join('&')}`;
            }

            const res = await apiFetch(feedUrl, { token: token || undefined });
            const mapped = (res.items as any[]).map(mapApiItemToUi);
            // Debug: Log first item to check distance and coordinates
            if (mapped.length > 0) {
                console.log('[Feed] First item distance:', {
                    distance_km: mapped[0].distance_km,
                    distance_miles: mapped[0].distance_miles,
                    owner: mapped[0].owner?.username,
                    owner_location: mapped[0].owner ? {
                        lat: mapped[0].owner.latitude,
                        lon: mapped[0].owner.longitude,
                    } : null,
                    raw_api_item: res.items[0]?.distance_km !== undefined ? {
                        distance_km: res.items[0].distance_km,
                        user_has_location: res.items[0].user?.latitude !== null,
                    } : null,
                });
            }
            setItems(mapped);
            setCurrentIndex(0);
            setAllCardsSwiped(false);
        } catch (error: any) {
            Alert.alert('Feed Error', error?.message || 'Could not load feed');
        } finally {
            setLoading(false);
        }
    };

    const mapApiItemToUi = (apiItem: any): Item => ({
        id: apiItem.id,
        item_id: String(apiItem.id),
        user_id: apiItem.user_id,
        title: apiItem.title,
        description: apiItem.description ?? '',
        category: apiItem.category,
        condition: apiItem.condition,
        photos: Array.isArray(apiItem.photos) && apiItem.photos.length > 0 && apiItem.photos[0] ? apiItem.photos : [PLACEHOLDER_IMAGE],
        looking_for: apiItem.looking_for,
        city: apiItem.city,
        status: apiItem.status,
        created_at: apiItem.created_at,
        owner: apiItem.user,
        user: apiItem.user,
        distance_km: apiItem.distance_km ?? null,
        distance_miles: apiItem.distance_miles ?? null,
    });

    const handleSwipeLeft = async (index: number) => {
        if (!items[index]) return;
        try {
            await apiFetch(ENDPOINTS.swipes, {
                method: 'POST',
                token: token || undefined,
                body: {
                    target_item_id: items[index].id || items[index].item_id,
                    direction: 'left',
                },
            });
        } catch (error) {
            console.warn('Swipe left failed', error);
        }
    };

    const handleSwipeRight = (index: number) => {
        if (!items[index]) return;

        // Don't show modal if we're currently processing a swipe (programmatic swipe after item selection)
        // or if modal is already visible (prevent duplicate modals)
        if (isProcessingSwipeRef.current || itemSelectionModalVisible) {
            return;
        }

        // Check if user has any items to offer
        if (userItems.length === 0) {
            Alert.alert(
                'No Items to Offer',
                'You need to have at least one active item to make an offer. Please upload an item first.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Show item selection modal
        setPendingSwipeItem(items[index]);
        setItemSelectionModalVisible(true);
    };

    const handleItemSelection = async (offeredItem: Item) => {
        if (!pendingSwipeItem) return;

        // Find the index of the pending item
        const pendingIndex = items.findIndex(
            (item) => (item.id || item.item_id) === (pendingSwipeItem.id || pendingSwipeItem.item_id)
        );

        // Check if this was triggered from button press (card hasn't been swiped yet)
        const isButtonPress = pendingIndex === currentIndex;

        // Set flag IMMEDIATELY to prevent modal from showing again on programmatic swipe
        // This must be set before closing modal or triggering any swipes
        if (isButtonPress) {
            isProcessingSwipeRef.current = true;
        }

        setItemSelectionModalVisible(false);

        try {
            const response = await apiFetch(ENDPOINTS.swipes, {
                method: 'POST',
                token: token || undefined,
                body: {
                    target_item_id: pendingSwipeItem.id || pendingSwipeItem.item_id,
                    direction: 'right',
                    offered_item_id: offeredItem.id || offeredItem.item_id,
                },
            });

            // If button press, swipe the card programmatically
            // The flag is already set above, so onSwipedRight won't show modal again
            if (isButtonPress && swiperRef.current) {
                swiperRef.current.swipeRight();
            }
            // If gesture swipe, index was already advanced in onSwipedRight

            // Check if a match was created
            if (response.match_created && response.match) {
                const matchedUserId = response.match.user1_id === user?.id
                    ? response.match.user2_id
                    : response.match.user1_id;
                const matchedUserData = response.match.user1_id === user?.id
                    ? response.match.user2
                    : response.match.user1;

                setMatchedUser(matchedUserData || { username: 'Someone' });
                setMatchModalVisible(true);
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Could not complete swipe');
            // Reset flag on error so user can try again
            if (isButtonPress) {
                isProcessingSwipeRef.current = false;
            }
        } finally {
            setPendingSwipeItem(null);
            // Reset gesture swipe flags since the swipe was completed
            isGestureSwipeRef.current = false;
            previousIndexRef.current = null;
            // Reset flag after a delay to allow swipe animation to complete
            // Only reset if it was a button press (programmatic swipe)
            if (isButtonPress) {
                setTimeout(() => {
                    isProcessingSwipeRef.current = false;
                }, 1000);
            }
        }
    };

    const handleCancelItemSelection = () => {
        setItemSelectionModalVisible(false);

        // If this was a gesture swipe, revert the card back to the previous item
        if (isGestureSwipeRef.current && previousIndexRef.current !== null && swiperRef.current) {
            // Revert the index back to the previous card
            setCurrentIndex(previousIndexRef.current);
            // Use swipeBack to bring the card back visually
            swiperRef.current.swipeBack();
            // Reset allCardsSwiped if we're going back
            if (previousIndexRef.current < items.length) {
                setAllCardsSwiped(false);
            }
        }

        // Reset flags
        isProcessingSwipeRef.current = false;
        isGestureSwipeRef.current = false;
        previousIndexRef.current = null;

        setPendingSwipeItem(null);
    };

    const renderCard = (item: Item | null) => {
        if (!item) {
            return null;
        }
        const ownerPhoto = item.owner?.profile_photo || item.user?.profile_photo || PLACEHOLDER_AVATAR;
        const itemPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : PLACEHOLDER_IMAGE;

        // Handle web image loading - ensure proper URI format
        const getImageUri = (uri: string) => {
            if (!uri) return PLACEHOLDER_IMAGE;
            // If it's already a valid HTTP/HTTPS URL, use it as is
            if (uri.startsWith('http://') || uri.startsWith('https://')) {
                return uri;
            }
            // If it's a data URI or blob URI, use it directly (works on web)
            if (uri.startsWith('data:') || uri.startsWith('blob:')) {
                return uri;
            }
            // If it's a file:// URI, on web we need to handle it differently
            if (Platform.OS === 'web' && uri.startsWith('file://')) {
                // On web, file:// URIs don't work, use placeholder
                return PLACEHOLDER_IMAGE;
            }
            // Default: return as is (might be relative path)
            return uri;
        };

        return (
            <View style={styles.cardWrapper}>
                <View style={styles.cardShadowLayer1} />
                <View style={styles.cardShadowLayer2} />
                <View style={styles.card}>
                    {failedImages.has(itemPhoto) || itemPhoto === PLACEHOLDER_IMAGE ? (
                        <View style={[styles.cardImage, { backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
                            {Platform.OS === 'web' && (
                                <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>
                                    {itemPhoto === PLACEHOLDER_IMAGE ? 'No Image' : 'Failed to Load'}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Image
                            source={{ uri: getImageUri(itemPhoto) }}
                            style={styles.cardImage}
                            resizeMode="cover"
                            onError={(error) => {
                                console.warn('Image failed to load on web:', {
                                    originalUri: itemPhoto,
                                    processedUri: getImageUri(itemPhoto),
                                    error,
                                    platform: Platform.OS
                                });
                                setFailedImages(prev => new Set(prev).add(itemPhoto));
                            }}
                            onLoadStart={() => {
                                if (Platform.OS === 'web') {
                                    console.log('Loading image on web:', {
                                        originalUri: itemPhoto,
                                        processedUri: getImageUri(itemPhoto)
                                    });
                                }
                            }}
                            onLoad={() => {
                                if (Platform.OS === 'web') {
                                    console.log('Image loaded successfully on web:', itemPhoto);
                                }
                            }}
                        />
                    )}

                    <View style={styles.cardContent}>
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={styles.conditionBadge}>
                                <Text style={styles.conditionText}>{item.condition.replace('_', ' ')}</Text>
                            </View>
                        </View>

                        <Text style={styles.itemDescription} numberOfLines={3}>
                            {item.description}
                        </Text>

                        <View style={styles.lookingForContainer}>
                            <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                            <View style={styles.lookingForTextContainer}>
                                <Text style={styles.lookingForLabel}>Looking for: </Text>
                                <Text style={styles.lookingForText}>{item.looking_for}</Text>
                            </View>
                        </View>

                        <View style={styles.ownerInfo}>
                            <View style={styles.ownerRow}>
                                <Image
                                    source={{ uri: ownerPhoto }}
                                    style={styles.ownerAvatar}
                                />
                                <View style={styles.ownerDetails}>
                                    <Text style={styles.ownerName}>{item.owner?.username || item.user?.username || 'Unknown'}</Text>
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.locationText}>{item.city || 'Unknown'}</Text>
                                        {(item.distance_km !== null && item.distance_km !== undefined) && (
                                            <>
                                                <Text style={styles.locationSeparator}>•</Text>
                                                <Ionicons name="navigate" size={12} color={COLORS.textSecondary} />
                                                <Text style={styles.distanceText}>
                                                    {typeof item.distance_km === 'number' && item.distance_km < 0.001
                                                        ? '< 1m'
                                                        : typeof item.distance_km === 'number' && item.distance_km < 1
                                                            ? `${Math.round(item.distance_km * 1000)}m`
                                                            : typeof item.distance_km === 'number'
                                                                ? `${item.distance_km.toFixed(1)}km`
                                                                : ''
                                                    }
                                                </Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    <Pressable
                        style={styles.infoButton}
                        onPress={() => navigation.navigate('ItemDetails', { item })}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.infoButtonText}>i</Text>
                    </Pressable>
                </View>
            </View>
        );
    };

    const renderNoMoreCards = () => {
        return (
            <View style={styles.noMoreCards}>
                <Ionicons name="checkmark-circle" size={100} color={COLORS.accentSuccess} />
                <Text style={styles.noMoreCardsTitle}>That's all for now!</Text>
                <Text style={styles.noMoreCardsText}>
                    You've swiped through all available items.{'\n'}
                    Check back later for more items to swap!
                </Text>
            </View>
        );
    };

    const handleCategorySelect = (category: string | null) => {
        setSelectedCategory(category);
        setFilterModalVisible(false);
    };

    const handleCitySelect = (city: string | null) => {
        setSelectedCity(city);
        setLocationModalVisible(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="filter" size={16} color={COLORS.primary} />
                    <Text style={styles.filterButtonText}>
                        {selectedCategory || 'All Categories'}
                    </Text>
                    {selectedCategory && (
                        <TouchableOpacity
                            style={styles.clearFilterButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleCategorySelect(null);
                            }}
                        >
                            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.locationBadge}
                    onPress={() => setLocationModalVisible(true)}
                >
                    <Ionicons name="location" size={16} color={COLORS.primary} />
                    <Text style={styles.locationBadgeText}>
                        {selectedCity === 'all' ? 'All Cities' : selectedCity || user?.city || 'City'}
                    </Text>
                    {selectedCity && (
                        <TouchableOpacity
                            style={styles.clearFilterButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleCitySelect(null);
                            }}
                        >
                            <Ionicons name="close-circle" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </View>

            {/* Match Success Modal */}
            <Modal
                visible={matchModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setMatchModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setMatchModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.matchModalContent}>
                                <View style={styles.matchModalHeader}>
                                    <Image
                                        source={require('../../assets/images/handshake.png')}
                                        style={{ width: 80, height: 80, marginBottom: 10 }}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.matchModalTitle}>It's a Match! 🎉</Text>
                                    <Text style={styles.matchModalSubtitle}>
                                        You and {matchedUser?.username || 'someone'} both liked each other's items!
                                    </Text>
                                </View>
                                <View style={styles.matchModalButtons}>
                                    <TouchableOpacity
                                        style={[styles.matchModalButton, styles.matchModalButtonSecondary]}
                                        onPress={() => setMatchModalVisible(false)}
                                    >
                                        <Text style={styles.matchModalButtonTextSecondary}>Keep Swiping</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.matchModalButton, styles.matchModalButtonPrimary]}
                                        onPress={() => {
                                            setMatchModalVisible(false);
                                            navigation.navigate('Matches');
                                        }}
                                    >
                                        <Text style={styles.matchModalButtonTextPrimary}>View Matches</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Filter by Category</Text>
                                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                        <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={[null, ...categories]}
                                    keyExtractor={(item) => item || 'all'}
                                    renderItem={({ item }) => {
                                        const isSelected = selectedCategory === item;
                                        const label = item || 'All Categories';
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.categoryOption,
                                                    isSelected && styles.categoryOptionSelected,
                                                ]}
                                                onPress={() => handleCategorySelect(item)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.categoryOptionText,
                                                        isSelected && styles.categoryOptionTextSelected,
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={18}
                                                        color={COLORS.primary}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                    contentContainerStyle={styles.modalListContent}
                                    showsVerticalScrollIndicator={true}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Location Filter Modal */}
            <Modal
                visible={locationModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLocationModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setLocationModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Filter by City</Text>
                                    <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                                        <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={[
                                        'all',
                                        ...(user?.city ? [null] : []),
                                        ...locations.filter((loc) => loc !== user?.city),
                                    ]}
                                    keyExtractor={(item) => item || 'default'}
                                    renderItem={({ item }) => {
                                        const isSelected = selectedCity === item;
                                        let label = 'My City';
                                        if (item === 'all') {
                                            label = 'All Cities';
                                        } else if (item) {
                                            label = item;
                                        } else {
                                            label = user?.city || 'My City';
                                        }
                                        return (
                                            <TouchableOpacity
                                                style={[
                                                    styles.categoryOption,
                                                    isSelected && styles.categoryOptionSelected,
                                                ]}
                                                onPress={() => handleCitySelect(item)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.categoryOptionText,
                                                        isSelected && styles.categoryOptionTextSelected,
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={18}
                                                        color={COLORS.primary}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    }}
                                    contentContainerStyle={styles.modalListContent}
                                    showsVerticalScrollIndicator={true}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Item Selection Modal */}
            <Modal
                visible={itemSelectionModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCancelItemSelection}
            >
                <TouchableWithoutFeedback onPress={handleCancelItemSelection}>
                    <View style={styles.bottomSheetOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.itemSelectionModalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Select Item to Offer</Text>
                                    <TouchableOpacity onPress={handleCancelItemSelection}>
                                        <Ionicons name="close" size={22} color={COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                {pendingSwipeItem && (
                                    <View style={styles.pendingItemInfo}>
                                        <Text style={styles.pendingItemLabel}>You want:</Text>
                                        <Text style={styles.pendingItemTitle}>{pendingSwipeItem.title}</Text>
                                    </View>
                                )}

                                <Text style={styles.itemSelectionSubtitle}>
                                    Which item do you want to offer in exchange?
                                </Text>

                                {userItems.length === 0 ? (
                                    <View style={styles.emptyItemsContainer}>
                                        <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
                                        <Text style={styles.emptyItemsText}>No items available</Text>
                                        <Text style={styles.emptyItemsSubtext}>
                                            You need to upload an item before making an offer
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.uploadItemButton}
                                            onPress={() => {
                                                handleCancelItemSelection();
                                                navigation.navigate('UploadItem');
                                            }}
                                        >
                                            <Ionicons name="add-circle" size={20} color={COLORS.secondary} />
                                            <Text style={styles.uploadItemButtonText}>Upload Item</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={userItems}
                                        keyExtractor={(item) => item.id || item.item_id || String(Math.random())}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                style={styles.userItemCard}
                                                onPress={() => handleItemSelection(item)}
                                            >
                                                <Image
                                                    source={{ uri: item.photos[0] || PLACEHOLDER_IMAGE }}
                                                    style={styles.userItemImage}
                                                />
                                                <View style={styles.userItemInfo}>
                                                    <Text style={styles.userItemTitle} numberOfLines={2}>
                                                        {item.title}
                                                    </Text>
                                                    <Text style={styles.userItemDescription} numberOfLines={1}>
                                                        {item.description || 'No description'}
                                                    </Text>
                                                    <View style={styles.userItemMeta}>
                                                        <View style={styles.conditionBadgeSmall}>
                                                            <Text style={styles.conditionTextSmall}>
                                                                {item.condition.replace('_', ' ')}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.userItemCategory}>{item.category}</Text>
                                                    </View>
                                                </View>
                                                <Ionicons
                                                    name="chevron-forward"
                                                    size={20}
                                                    color={COLORS.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        )}
                                        contentContainerStyle={styles.itemSelectionListContent}
                                        showsVerticalScrollIndicator={true}
                                    />
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <View style={styles.swiperContainer} pointerEvents="box-none">
                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : allCardsSwiped || (items.length > 0 && currentIndex >= items.length) ? (
                    renderNoMoreCards()
                ) : items.length > 0 ? (
                    <Swiper
                        cards={items}
                        renderCard={renderCard}
                        ref={swiperRef}
                        onSwipedLeft={(idx) => {
                            handleSwipeLeft(idx);
                            const newIndex = idx + 1;
                            setCurrentIndex(newIndex);
                            if (newIndex >= items.length) {
                                setAllCardsSwiped(true);
                            }
                            // Reset gesture flags in case there was a pending right swipe
                            isGestureSwipeRef.current = false;
                            previousIndexRef.current = null;
                        }}
                        onSwipedRight={(idx) => {
                            // This is called after gesture swipe animation completes
                            // The card is already visually swiped, so we need to advance the index
                            // but show modal for item selection before sending API call

                            // Track that this was a gesture swipe and save the previous index
                            // This allows us to revert if the modal is canceled
                            isGestureSwipeRef.current = true;
                            previousIndexRef.current = idx; // Save the index of the card that was swiped

                            // Advance index immediately since gesture swipe already happened visually
                            const newIndex = idx + 1;
                            setCurrentIndex(newIndex);
                            if (newIndex >= items.length) {
                                setAllCardsSwiped(true);
                            }

                            // Only show modal if not processing a programmatic swipe
                            if (!isProcessingSwipeRef.current) {
                                handleSwipeRight(idx);
                            }
                        }}
                        onSwipedAll={() => {
                            setAllCardsSwiped(true);
                        }}
                        cardIndex={currentIndex}
                        backgroundColor="transparent"
                        stackSize={3}
                        stackSeparation={Platform.OS === 'ios' ? 18 : 20}
                        stackScale={Platform.OS === 'ios' ? 10 : 5}
                        cardVerticalMargin={Platform.OS === 'ios' ? 5 : -15}
                        cardHorizontalMargin={0}
                        disableTopSwipe={false}
                        disableBottomSwipe={false}
                        verticalSwipe={false}
                        overlayLabels={{
                            left: {
                                title: 'PASS',
                                style: {
                                    label: {
                                        backgroundColor: COLORS.accentError,
                                        color: COLORS.secondary,
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        borderRadius: 10,
                                        padding: 10,
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        marginTop: 30,
                                        marginLeft: -30,
                                    },
                                },
                            },
                            right: {
                                title: 'INTERESTED',
                                style: {
                                    label: {
                                        backgroundColor: COLORS.accentSuccess,
                                        color: COLORS.secondary,
                                        fontSize: 24,
                                        fontWeight: 'bold',
                                        borderRadius: 10,
                                        padding: 10,
                                    },
                                    wrapper: {
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        marginTop: 30,
                                        marginLeft: 30,
                                    },
                                },
                            },
                        }}
                        animateOverlayLabelsOpacity
                        animateCardOpacity
                        swipeBackCard
                    />
                ) : (
                    renderNoMoreCards()
                )}
            </View>

            {items.length > 0 && !allCardsSwiped && currentIndex < items.length && (
                <View style={styles.actionButtons}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.passButton,
                            pressed && styles.actionButtonPressed,
                        ]}
                        onPress={() => {
                            if (swiperRef.current && currentIndex < items.length) {
                                swiperRef.current.swipeLeft();
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="close" size={32} color={COLORS.accentError} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.actionButton,
                            styles.likeButton,
                            pressed && styles.actionButtonPressed,
                        ]}
                        onPress={() => {
                            // Show item selection modal first
                            if (items[currentIndex]) {
                                handleSwipeRight(currentIndex);
                            }
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="heart" size={32} color={COLORS.accentSuccess} />
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 0,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 4,
    },
    clearFilterButton: {
        marginLeft: 4,
    },
    locationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    locationBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 4,
    },
    swiperContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: Platform.OS === 'ios' ? 12 : 24,
        paddingBottom: Platform.OS === 'ios' ? 120 : 100,
        marginBottom: 0,
        justifyContent: 'flex-start',
        alignItems: 'center',
        // iOS needs this to show shadows properly
        ...Platform.select({
            ios: {
                overflow: 'visible',
            },
        }),
    },
    cardWrapper: {
        width: '100%',
        height: Platform.OS === 'ios' ? Math.min(520, height * 0.65) : 520,
        marginBottom: 24,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        // iOS needs this to show shadows properly
        ...Platform.select({
            ios: {
                overflow: 'visible',
            },
        }),
    },
    cardShadowLayer1: {
        position: 'absolute',
        top: 20,
        left: 8,
        right: -8,
        bottom: -20,
        borderRadius: 28,
        backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
            },
            android: {
                elevation: 20,
            },
        }),
    },
    cardShadowLayer2: {
        position: 'absolute',
        top: 10,
        left: 4,
        right: -4,
        bottom: -10,
        borderRadius: 28,
        backgroundColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.4,
                shadowRadius: 25,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    card: {
        height: '100%',
        borderRadius: 28,
        backgroundColor: COLORS.secondary,
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        // Main card shadow - extremely strong and visible for iOS
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.9,
                shadowRadius: 60,
            },
            android: {
                elevation: 50,
                shadowColor: '#000',
            },
        }),
    },

    cardImage: {
        width: '100%',
        height: '50%',
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 20,
        paddingBottom: 20,
        flex: 1,
        justifyContent: 'space-between',
        minHeight: 220,
        backgroundColor: COLORS.secondary,
    },
    itemInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 12,
        width: '100%',
    },
    itemTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        flex: 1,
        lineHeight: 30,
        marginRight: 8,
    },
    conditionBadge: {
        backgroundColor: COLORS.accentSuccess,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        flexShrink: 0,
    },
    conditionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.secondary,
        textTransform: 'capitalize',
    },
    itemDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
        lineHeight: 20,
    },
    lookingForContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: COLORS.background,
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        gap: 10,
        width: '100%',
    },
    lookingForTextContainer: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    lookingForLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    lookingForText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        flex: 1,
    },
    ownerInfo: {
        marginTop: 4,
        paddingTop: 12,
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    ownerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: COLORS.background,
    },
    ownerDetails: {
        flex: 1,
    },
    ownerName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
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
        fontSize: 12,
        color: COLORS.textSecondary,
        marginHorizontal: 4,
    },
    distanceText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginLeft: 2,
    },
    infoButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: COLORS.accentError,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    infoButtonText: {
        color: COLORS.secondary,
        fontSize: 20,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    actionButtons: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        paddingHorizontal: 20,
        zIndex: 100,
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    actionButtonPressed: {
        transform: [{ scale: 0.95 }],
        opacity: 0.8,
    },
    passButton: {
        borderWidth: 2,
        borderColor: COLORS.accentError,
    },
    likeButton: {
        borderWidth: 2,
        borderColor: COLORS.accentSuccess,
    },
    noMoreCards: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        width: '100%',
    },
    noMoreCardsTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    noMoreCardsText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.secondary,
        borderRadius: 16,
        width: '85%',
        maxHeight: '75%',
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    modalListContent: {
        paddingBottom: 8,
    },
    categoryOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginBottom: 6,
        backgroundColor: COLORS.background,
    },
    categoryOptionSelected: {
        backgroundColor: COLORS.primary + '15',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    categoryOptionText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    categoryOptionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    matchModalContent: {
        backgroundColor: COLORS.secondary,
        borderRadius: 24,
        width: '85%',
        maxWidth: 400,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    matchModalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    matchModalTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    matchModalSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    matchModalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    matchModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    matchModalButtonPrimary: {
        backgroundColor: COLORS.primary,
    },
    matchModalButtonSecondary: {
        backgroundColor: COLORS.background,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    matchModalButtonTextPrimary: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    matchModalButtonTextSecondary: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    itemSelectionModalContent: {
        backgroundColor: COLORS.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        width: '100%',
        height: '85%',
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    bottomSheetOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pendingItemInfo: {
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    pendingItemLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
    },
    pendingItemTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    itemSelectionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    emptyItemsContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyItemsText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyItemsSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    uploadItemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    uploadItemButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    itemSelectionListContent: {
        paddingBottom: 8,
    },
    userItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    userItemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: COLORS.border,
        marginRight: 12,
    },
    userItemInfo: {
        flex: 1,
        marginRight: 8,
    },
    userItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    userItemDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    userItemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    conditionBadgeSmall: {
        backgroundColor: COLORS.accentSuccess,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    conditionTextSmall: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.secondary,
        textTransform: 'capitalize',
    },
    userItemCategory: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
});
