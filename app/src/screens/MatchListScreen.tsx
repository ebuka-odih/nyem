import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Conversation } from '../types';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

type MatchListScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
    navigation: MatchListScreenNavigationProp;
}

// Placeholder avatar for testing
const PLACEHOLDER_AVATAR = 'https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg';

export default function MatchListScreen({ navigation }: Props) {
    const { token, user } = useAuth();
    const { subscribeToUserChannel, isConnected } = useWebSocket();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadConversations = useCallback(async () => {
        try {
            const response = await apiFetch(ENDPOINTS.conversations, {
                token: token || undefined,
            });
            
            setConversations(response.conversations || []);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            loadConversations();
        }
    }, [token, loadConversations]);

    const onRefresh = () => {
        setRefreshing(true);
        loadConversations();
    };

    // Helper function to fetch a single conversation by ID
    const fetchConversationById = useCallback(async (conversationId: string): Promise<Conversation | null> => {
        try {
            const response = await apiFetch(ENDPOINTS.conversations, {
                token: token || undefined,
            });
            
            const conversation = (response.conversations || []).find(
                (conv: Conversation) => conv.id === conversationId
            );
            return conversation || null;
        } catch (error) {
            console.error('Failed to fetch conversation:', error);
            return null;
        }
    }, [token]);

    // Handle WebSocket events for real-time updates
    useEffect(() => {
        if (!user?.id || !isConnected) {
            return;
        }

        const unsubscribe = subscribeToUserChannel(user.id, (data: any) => {
            console.log('[MatchListScreen] Received WebSocket event:', data);

            // Handle match.created event
            if (data.type === 'match.created' && data.conversation_id) {
                console.log('[MatchListScreen] Match created, reloading conversations');
                // Reload conversations to get the new match
                loadConversations();
            }

            // Handle conversation.created event
            if (data.type === 'conversation.created' && data.conversation_id) {
                console.log('[MatchListScreen] Conversation created, reloading conversations');
                // Reload conversations to get the new conversation
                loadConversations();
            }

            // Handle message.sent event
            if (data.type === 'message.sent' && data.conversation_id && data.message) {
                console.log('[MatchListScreen] Message sent, updating conversation');
                
                setConversations((prevConversations) => {
                    const conversationIndex = prevConversations.findIndex(
                        (conv) => conv.id === data.conversation_id
                    );

                    if (conversationIndex >= 0) {
                        // Conversation exists, update last_message and move to top
                        const updatedConversations = [...prevConversations];
                        const conversation = updatedConversations[conversationIndex];
                        
                        // Update last message
                        const updatedConversation: Conversation = {
                            ...conversation,
                            last_message: {
                                id: data.message.id || data.message.message_id,
                                message_text: data.message.message_text || data.message.text,
                                sender_id: data.message.sender_id,
                                created_at: data.message.created_at || data.message.timestamp,
                            },
                            updated_at: data.message.created_at || data.message.timestamp || new Date().toISOString(),
                        };

                        // Remove from current position and add to top
                        updatedConversations.splice(conversationIndex, 1);
                        return [updatedConversation, ...updatedConversations];
                    } else {
                        // Conversation doesn't exist in list, fetch it
                        console.log('[MatchListScreen] Conversation not in list, fetching...');
                        fetchConversationById(data.conversation_id).then((conversation) => {
                            if (conversation) {
                                // Update with the new message
                                const updatedConversation: Conversation = {
                                    ...conversation,
                                    last_message: {
                                        id: data.message.id || data.message.message_id,
                                        message_text: data.message.message_text || data.message.text,
                                        sender_id: data.message.sender_id,
                                        created_at: data.message.created_at || data.message.timestamp,
                                    },
                                    updated_at: data.message.created_at || data.message.timestamp || new Date().toISOString(),
                                };
                                
                                // Add to top of list
                                setConversations((prev) => [updatedConversation, ...prev]);
                            } else {
                                // If fetch fails, reload all conversations
                                console.log('[MatchListScreen] Failed to fetch conversation, reloading all');
                                loadConversations();
                            }
                        });
                        
                        // Return current conversations while fetching
                        return prevConversations;
                    }
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [user?.id, isConnected, subscribeToUserChannel, fetchConversationById, loadConversations]);

    const renderConversation = ({ item }: { item: Conversation }) => {
        const otherUser = item.other_user;
        const lastMessage = item.last_message;
        
        return (
            <TouchableOpacity
                style={styles.matchCard}
                onPress={() => navigation.navigate('Chat', { conversation: item })}
            >
                <Image
                    source={{ uri: otherUser?.profile_photo || PLACEHOLDER_AVATAR }}
                    style={styles.matchPhoto}
                />
                <View style={styles.matchInfo}>
                    <Text style={styles.matchName}>{otherUser?.username || 'Unknown User'}</Text>
                    {lastMessage ? (
                        <Text style={styles.matchMessage} numberOfLines={1}>
                            {lastMessage.message_text}
                        </Text>
                    ) : (
                        <Text style={styles.matchMessage}>Tap to start chatting</Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
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
            <TouchableOpacity
                style={styles.matchRequestsButton}
                onPress={() => navigation.navigate('MatchRequests')}
            >
                <Ionicons name="notifications" size={24} color={COLORS.primary} />
                <Text style={styles.matchRequestsButtonText}>Match Requests</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {conversations.length > 0 ? (
                <FlatList
                    data={conversations}
                    renderItem={renderConversation}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
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
                    <Text style={styles.emptyTitle}>No matches yet</Text>
                    <Text style={styles.emptyText}>
                        Start swiping right on items you like!{'\n'}
                        When someone swipes right on your item too, you'll get a match! 🎉
                    </Text>
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
    matchRequestsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    matchRequestsButtonText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 12,
    },
    listContent: {
        padding: 20,
    },
    matchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    matchPhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    matchInfo: {
        flex: 1,
    },
    matchName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    matchMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    centerContent: {
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
});
