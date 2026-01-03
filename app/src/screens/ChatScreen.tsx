import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Message, ConversationMatch } from '../types';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
    route: ChatScreenRouteProp;
}

type ChatItem = Message | { type: 'match'; data: ConversationMatch };

export default function ChatScreen({ route }: Props) {
    const { conversation } = route.params;
    const { token, user } = useAuth();
    const { subscribeToConversation, isConnected } = useWebSocket();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [matches, setMatches] = useState<ConversationMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (token && conversation.id) {
            loadChatData();
        }
    }, [token, conversation.id]);

    // Subscribe to real-time messages for this conversation
    useEffect(() => {
        if (!conversation.id || !isConnected) {
            return;
        }

        console.log('[ChatScreen] Setting up WebSocket listener for conversation:', conversation.id);

        const unsubscribe = subscribeToConversation(conversation.id, (newMessage: any) => {
            console.log('[ChatScreen] Received new message via WebSocket:', newMessage);
            
            // Check if message already exists (avoid duplicates)
            setMessages((prev) => {
                const exists = prev.some(
                    (msg) => msg.id === newMessage.id || msg.message_id === newMessage.id
                );
                
                if (exists) {
                    console.log('[ChatScreen] Message already exists, skipping');
                    return prev;
                }

                // Convert the received message to our Message format
                const formattedMessage: Message = {
                    id: newMessage.id,
                    message_id: newMessage.id,
                    conversation_id: newMessage.conversation_id || conversation.id,
                    sender_id: newMessage.sender_id,
                    receiver_id: newMessage.receiver_id,
                    message_text: newMessage.text || newMessage.message_text,
                    timestamp: newMessage.created_at,
                    created_at: newMessage.created_at,
                    sender: newMessage.sender,
                };

                console.log('[ChatScreen] Adding new message to state');
                return [...prev, formattedMessage];
            });
        });

        return () => {
            console.log('[ChatScreen] Cleaning up WebSocket subscription');
            unsubscribe();
        };
    }, [conversation.id, isConnected, subscribeToConversation]);

    const loadChatData = async () => {
        try {
            setLoading(true);
            const [messagesResponse, matchesResponse] = await Promise.all([
                apiFetch(ENDPOINTS.conversationMessages(conversation.id), {
                    token: token || undefined,
                }),
                apiFetch(ENDPOINTS.conversationMatches(conversation.id), {
                    token: token || undefined,
                }),
            ]);

            setMessages(messagesResponse.messages || []);
            setMatches(matchesResponse.matches || []);
        } catch (error) {
            console.error('Failed to load chat data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim() || sending) return;

        const messageText = message.trim();
        setMessage('');
        setSending(true);

        // Optimistically add message
        const tempMessage: Message = {
            message_id: `temp-${Date.now()}`,
            conversation_id: conversation.id,
            sender_id: user?.id || '',
            receiver_id: conversation.other_user.id,
            message_text: messageText,
            timestamp: new Date().toISOString(),
            sender: user,
        };

        setMessages((prev) => [...prev, tempMessage]);

        try {
            const response = await apiFetch(ENDPOINTS.messages, {
                method: 'POST',
                token: token || undefined,
                body: {
                    conversation_id: conversation.id,
                    message_text: messageText,
                },
            });

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.message_id === tempMessage.message_id ? response.message : msg
                )
            );
        } catch (error) {
            console.error('Failed to send message:', error);
            // Remove temp message on error
            setMessages((prev) => prev.filter((msg) => msg.message_id !== tempMessage.message_id));
            setMessage(messageText); // Restore message text
        } finally {
            setSending(false);
        }
    };

    // Combine matches and messages, sorted by created_at
    const getChatItems = (): ChatItem[] => {
        const items: ChatItem[] = [];

        // Add matches as informational cards
        matches.forEach((match) => {
            items.push({ type: 'match', data: match });
        });

        // Add messages
        messages.forEach((msg) => {
            items.push(msg);
        });

        // Sort by created_at (matches and messages)
        return items.sort((a, b) => {
            const aTime =
                'type' in a
                    ? new Date(a.data.created_at).getTime()
                    : new Date(a.created_at || a.timestamp || 0).getTime();
            const bTime =
                'type' in b
                    ? new Date(b.data.created_at).getTime()
                    : new Date(b.created_at || b.timestamp || 0).getTime();
            return aTime - bTime;
        });
    };

    const renderMatchCard = (match: ConversationMatch) => {
        return (
            <View style={styles.matchCard}>
                <View style={styles.matchCardHeader}>
                    <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
                    <Text style={styles.matchCardTitle}>Trade Match</Text>
                </View>
                <View style={styles.matchCardContent}>
                    <View style={styles.matchCardItem}>
                        <Text style={styles.matchCardItemLabel}>Your item:</Text>
                        <Text style={styles.matchCardItemTitle} numberOfLines={1}>
                            {match.my_item.title}
                        </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
                    <View style={styles.matchCardItem}>
                        <Text style={styles.matchCardItemLabel}>Their item:</Text>
                        <Text style={styles.matchCardItemTitle} numberOfLines={1}>
                            {match.their_item.title}
                        </Text>
                    </View>
                </View>
                <Text style={styles.matchCardTime}>
                    {new Date(match.created_at).toLocaleDateString()}
                </Text>
            </View>
        );
    };

    const renderMessage = (item: Message) => {
        const isMe = item.sender_id === user?.id;

        return (
            <View style={[styles.messageContainer, isMe && styles.myMessageContainer]}>
                <View style={[styles.messageBubble, isMe && styles.myMessageBubble]}>
                    <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                        {item.message_text}
                    </Text>
                    <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                        {new Date(item.created_at || item.timestamp || Date.now()).toLocaleTimeString(
                            [],
                            {
                                hour: '2-digit',
                                minute: '2-digit',
                            }
                        )}
                    </Text>
                </View>
            </View>
        );
    };

    const renderChatItem = ({ item }: { item: ChatItem }) => {
        if ('type' in item && item.type === 'match') {
            return renderMatchCard(item.data);
        }
        return renderMessage(item as Message);
    };

    const chatItems = getChatItems();

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
        >
            {chatItems.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={80} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>Start the conversation</Text>
                    <Text style={styles.emptyText}>
                        Say hi to {conversation.other_user?.username}!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={chatItems}
                    renderItem={renderChatItem}
                    keyExtractor={(item, index) => {
                        if ('type' in item) {
                            return `match-${item.data.id}`;
                        }
                        return item.id || item.message_id || `msg-${index}`;
                    }}
                    contentContainerStyle={styles.messagesList}
                    inverted={false}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    editable={!sending}
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!message.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color={COLORS.secondary} />
                    ) : (
                        <Ionicons name="send" size={24} color={COLORS.secondary} />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
    },
    messagesList: {
        padding: 20,
    },
    matchCard: {
        backgroundColor: COLORS.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    matchCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    matchCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 8,
    },
    matchCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    matchCardItem: {
        flex: 1,
    },
    matchCardItemLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    matchCardItemTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    matchCardTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    messageContainer: {
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    myMessageContainer: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        backgroundColor: COLORS.secondary,
        padding: 12,
        borderRadius: 16,
        maxWidth: '75%',
        borderBottomLeftRadius: 4,
    },
    myMessageBubble: {
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    myMessageText: {
        color: COLORS.secondary,
    },
    messageTime: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    myMessageTime: {
        color: COLORS.secondary,
        opacity: 0.8,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: COLORS.secondary,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: COLORS.textPrimary,
        maxHeight: 100,
        marginRight: 12,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
