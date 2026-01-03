import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Pressable,
    Modal,
    ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, MatchRequest, Item } from '../types';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

type MatchRequestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MatchRequests'>;

interface Props {
    navigation: MatchRequestScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding
const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80';
const PLACEHOLDER_AVATAR = 'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';

export default function MatchRequestScreen({ navigation }: Props) {
    const { token, user } = useAuth();
    const [requests, setRequests] = useState<MatchRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MatchRequest | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUser, setMatchedUser] = useState<any>(null);
    const [processingItem, setProcessingItem] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            loadRequests();
        }
    }, [token]);

    // Refresh requests when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (token) {
                loadRequests();
            }
        }, [token])
    );

    const loadRequests = async () => {
        try {
            const response = await apiFetch(ENDPOINTS.tradeOffers.pending, {
                token: token || undefined,
            });
            console.log('Trade Offers Response:', JSON.stringify(response, null, 2));
            
            // Transform backend response to match frontend expected structure
            const transformedRequests: MatchRequest[] = (response.offers || []).map((offer: any) => ({
                id: offer.id,
                from_user: {
                    id: offer.from_user.id,
                    username: offer.from_user.username,
                    profile_photo: offer.from_user.photo,
                    city: offer.from_user.city,
                    phone: '', // Not provided by backend
                    role: 'user',
                },
                target_item: {
                    id: offer.target_item.id,
                    item_id: offer.target_item.id,
                    user_id: offer.from_user.id,
                    title: offer.target_item.title,
                    description: '',
                    category: '',
                    condition: 'used' as const,
                    photos: offer.target_item.photo ? [offer.target_item.photo] : [],
                    looking_for: '',
                    city: offer.from_user.city,
                    status: 'active' as const,
                },
                offered_item: {
                    id: offer.offered_item.id,
                    item_id: offer.offered_item.id,
                    user_id: offer.from_user.id,
                    title: offer.offered_item.title,
                    description: '',
                    category: '',
                    condition: 'used' as const,
                    photos: offer.offered_item.photo ? [offer.offered_item.photo] : [],
                    looking_for: '',
                    city: offer.from_user.city,
                    status: 'active' as const,
                },
                other_user_items: [], // Will be loaded separately if needed
                is_matched: false,
                created_at: offer.created_at,
            }));
            
            setRequests(transformedRequests);
        } catch (error: any) {
            console.error('Error loading trade offers:', error);
            Alert.alert('Error', error?.message || 'Could not load trade offers');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests();
    };

    const openRequestModal = (request: MatchRequest) => {
        setSelectedRequest(request);
        setModalVisible(true);
    };

    const closeRequestModal = () => {
        setModalVisible(false);
        setSelectedRequest(null);
    };

    const handleAccept = async () => {
        if (!selectedRequest) return;
        
        setProcessingItem(selectedRequest.id);
        try {
            const response = await apiFetch(ENDPOINTS.tradeOffers.respond(selectedRequest.id), {
                method: 'POST',
                token: token || undefined,
                body: {
                    decision: 'accept',
                },
            });

            if (response.match_created) {
                setMatchedUser(selectedRequest.from_user);
                setMatchModalVisible(true);
                closeRequestModal();
                setRequests(requests.filter((r) => r.id !== selectedRequest.id));
            } else {
                Alert.alert('Offer Accepted', 'You accepted the trade offer!');
                closeRequestModal();
                setRequests(requests.filter((r) => r.id !== selectedRequest.id));
            }
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Could not accept offer');
        } finally {
            setProcessingItem(null);
        }
    };

    const handleDecline = async () => {
        if (!selectedRequest) return;
        
        setProcessingItem(selectedRequest.id);
        try {
            await apiFetch(ENDPOINTS.tradeOffers.respond(selectedRequest.id), {
                method: 'POST',
                token: token || undefined,
                body: {
                    decision: 'decline',
                },
            });
            closeRequestModal();
            setRequests(requests.filter((r) => r.id !== selectedRequest.id));
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'Could not decline offer');
        } finally {
            setProcessingItem(null);
        }
    };

    const renderRequestCard = ({ item: request }: { item: MatchRequest }) => {
        const itemPhoto = request.target_item.photos && request.target_item.photos.length > 0 
            ? request.target_item.photos[0] 
            : PLACEHOLDER_IMAGE;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => openRequestModal(request)}
                activeOpacity={0.8}
            >
                <Image source={{ uri: itemPhoto }} style={styles.cardImage} />
                <View style={styles.cardOverlay}>
                    <View style={styles.cardContent}>
                        <View style={styles.cardUserInfo}>
                            <Image
                                source={{ uri: request.from_user.profile_photo || PLACEHOLDER_AVATAR }}
                                style={styles.cardAvatar}
                            />
                            <View style={styles.cardTextContainer}>
                                <Text style={styles.cardUsername} numberOfLines={1}>
                                    {request.from_user.username}
                                </Text>
                                <View style={styles.cardLocation}>
                                    <Ionicons name="location" size={12} color={COLORS.textSecondary} />
                                    <Text style={styles.cardLocationText} numberOfLines={1}>
                                        {request.from_user.city}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.cardBadge}>
                            {request.is_matched ? (
                                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                            ) : (
                                <Ionicons name="heart" size={14} color="#fff" />
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {requests.length > 0 ? (
                <FlatList
                    data={requests}
                    renderItem={renderRequestCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.row}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>No match requests</Text>
                    <Text style={styles.emptyText}>
                        When someone swipes right on your items,{'\n'}
                        you'll see them here! 🎉
                    </Text>
                </View>
            )}

            {/* Request Detail Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeRequestModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Pressable style={styles.modalCloseButton} onPress={closeRequestModal}>
                            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
                        </Pressable>

                        {selectedRequest && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* User Info Section */}
                                <View style={styles.modalUserSection}>
                                    <Image
                                        source={{ uri: selectedRequest.from_user.profile_photo || PLACEHOLDER_AVATAR }}
                                        style={styles.modalAvatar}
                                    />
                                    {selectedRequest.is_matched && (
                                        <View style={styles.matchedBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color={COLORS.accentSuccess} />
                                            <Text style={styles.matchedBadgeText}>Already Matched</Text>
                                        </View>
                                    )}
                                    <Text style={styles.modalUsername}>{selectedRequest.from_user.username}</Text>
                                    <View style={styles.modalLocation}>
                                        <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                                        <Text style={styles.modalLocationText}>{selectedRequest.from_user.city}</Text>
                                    </View>
                                    <Text style={styles.modalSubtitle}>
                                        Wants to trade for your item: <Text style={styles.modalItemTitle}>{selectedRequest.target_item.title}</Text>
                                    </Text>
                                </View>

                                {/* Trade Offer Section */}
                                <View style={styles.modalItemsSection}>
                                    <Text style={styles.modalSectionTitle}>Trade Offer</Text>
                                    
                                    {/* Your Item (Target Item) */}
                                    <View style={styles.tradeOfferCard}>
                                        <Text style={styles.tradeOfferLabel}>Your Item</Text>
                                        <View style={styles.tradeOfferItem}>
                                            <Image 
                                                source={{ uri: selectedRequest.target_item.photos && selectedRequest.target_item.photos.length > 0 
                                                    ? selectedRequest.target_item.photos[0] 
                                                    : PLACEHOLDER_IMAGE }} 
                                                style={styles.tradeOfferImage} 
                                            />
                                            <View style={styles.tradeOfferItemInfo}>
                                                <Text style={styles.tradeOfferItemTitle}>{selectedRequest.target_item.title}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Arrow/Exchange Icon */}
                                    <View style={styles.tradeOfferArrow}>
                                        <Ionicons name="swap-horizontal" size={32} color={COLORS.primary} />
                                    </View>

                                    {/* Offered Item */}
                                    {selectedRequest.offered_item && (
                                        <View style={styles.tradeOfferCard}>
                                            <Text style={styles.tradeOfferLabel}>They're Offering</Text>
                                            <View style={styles.tradeOfferItem}>
                                                <Image 
                                                    source={{ uri: selectedRequest.offered_item.photos && selectedRequest.offered_item.photos.length > 0 
                                                        ? selectedRequest.offered_item.photos[0] 
                                                        : PLACEHOLDER_IMAGE }} 
                                                    style={styles.tradeOfferImage} 
                                                />
                                                <View style={styles.tradeOfferItemInfo}>
                                                    <Text style={styles.tradeOfferItemTitle}>{selectedRequest.offered_item.title}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}

                                    {/* Accept/Decline Buttons */}
                                    <View style={styles.tradeOfferActions}>
                                        <Pressable
                                            style={[styles.modalActionButton, styles.declineButton]}
                                            onPress={handleDecline}
                                            disabled={processingItem === selectedRequest.id}
                                        >
                                            {processingItem === selectedRequest.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="close" size={18} color="#fff" />
                                                    <Text style={styles.modalActionButtonText}>Decline</Text>
                                                </>
                                            )}
                                        </Pressable>
                                        <Pressable
                                            style={[styles.modalActionButton, styles.acceptButton]}
                                            onPress={handleAccept}
                                            disabled={processingItem === selectedRequest.id}
                                        >
                                            {processingItem === selectedRequest.id ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                                    <Text style={styles.modalActionButtonText}>Accept</Text>
                                                </>
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Match Success Modal */}
            {matchModalVisible && matchedUser && (
                <View style={styles.matchModal}>
                    <View style={styles.matchModalContent}>
                        <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
                        <Text style={styles.matchSubtitle}>You and {matchedUser.username} liked each other's items!</Text>
                        <Image
                            source={{ uri: matchedUser.profile_photo || PLACEHOLDER_AVATAR }}
                            style={styles.matchAvatar}
                        />
                        <Pressable
                            style={styles.matchButton}
                            onPress={() => {
                                setMatchModalVisible(false);
                                setMatchedUser(null);
                                navigation.navigate('MainTabs', { screen: 'Matches' });
                            }}
                        >
                            <Text style={styles.matchButtonText}>View Matches</Text>
                        </Pressable>
                        <Pressable
                            style={styles.matchCloseButton}
                            onPress={() => {
                                setMatchModalVisible(false);
                                setMatchedUser(null);
                            }}
                        >
                            <Text style={styles.matchCloseButtonText}>Keep Browsing</Text>
                        </Pressable>
                    </View>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.3,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.secondary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 12,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardUserInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardUsername: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
        marginBottom: 2,
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardLocationText: {
        fontSize: 11,
        color: COLORS.secondary,
        marginLeft: 4,
        opacity: 0.9,
    },
    cardBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.accentSuccess,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginTop: 20,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingTop: 16,
    },
    modalCloseButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalUserSection: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    matchedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
        gap: 6,
    },
    matchedBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accentSuccess,
    },
    modalAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    modalUsername: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    modalLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalLocationText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginLeft: 6,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    modalItemTitle: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    modalItemsSection: {
        padding: 24,
    },
    modalSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    modalItemCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
    },
    modalItemImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    modalItemInfo: {
        padding: 16,
    },
    modalItemName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    modalItemCondition: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
        textTransform: 'capitalize',
    },
    modalItemLookingFor: {
        fontSize: 14,
        color: COLORS.primary,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    modalItemActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 6,
    },
    notInterestedButton: {
        backgroundColor: COLORS.accentError,
    },
    interestedButton: {
        backgroundColor: COLORS.accentSuccess,
    },
    declineButton: {
        backgroundColor: COLORS.accentError,
    },
    acceptButton: {
        backgroundColor: COLORS.accentSuccess,
    },
    // Trade Offer Styles
    tradeOfferCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    tradeOfferLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tradeOfferItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tradeOfferImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: COLORS.border,
        marginRight: 12,
    },
    tradeOfferItemInfo: {
        flex: 1,
    },
    tradeOfferItemTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    tradeOfferArrow: {
        alignItems: 'center',
        marginVertical: 8,
    },
    tradeOfferActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalActionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalNoItems: {
        padding: 40,
        alignItems: 'center',
    },
    modalNoItemsText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    // Match Modal Styles
    matchModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    matchModalContent: {
        backgroundColor: COLORS.secondary,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: width * 0.85,
    },
    matchTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    matchSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    matchAvatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 20,
    },
    matchButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 12,
        width: '100%',
    },
    matchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    matchCloseButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
    },
    matchCloseButtonText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    // Item Selection Modal Styles
    itemSelectionModalContent: {
        backgroundColor: COLORS.secondary,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    itemSelectionModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemSelectionModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
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
