import React, { useState, useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { TradeMatchCard } from './chat/TradeMatchCard';
import { ItemCard } from './chat/ItemCard';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { PLACEHOLDER_AVATAR, generateInitialsAvatar } from '../constants/placeholders';

interface ChatScreenProps {
  conversation: any | null;
  onBack: () => void;
}

interface ApiMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    profile_photo?: string;
  };
  receiver?: {
    id: string;
    username: string;
    profile_photo?: string;
  };
}

interface ConversationMatch {
  id: string;
  item1_title: string;
  item2_title: string;
  my_item: {
    id: string;
    title: string;
    image?: string;
    price?: number;
    type?: string;
  };
  their_item: {
    id: string;
    title: string;
    image?: string;
    price?: number;
    type?: string;
  };
  created_at: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ conversation, onBack }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [matches, setMatches] = useState<ConversationMatch[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadChatData = async () => {
    if (!conversation?.id || !token) return;

    try {
      setLoading(true);
      
      // Fetch both messages and matches in parallel
      const [messagesResponse, matchesResponse] = await Promise.all([
        apiFetch<{ messages: ApiMessage[] }>(
          ENDPOINTS.conversations.messages(conversation.id),
          { token }
        ),
        apiFetch<{ matches: ConversationMatch[] }>(
          ENDPOINTS.conversations.matches(conversation.id),
          { token }
        ).catch((error) => {
          // If matches endpoint fails, just return empty array
          console.warn('[ChatScreen] Failed to load matches:', error);
          return { matches: [] };
        }),
      ]);
      
      // Handle different response structures for messages
      let fetchedMessages: ApiMessage[] = [];
      if (Array.isArray(messagesResponse.messages)) {
        fetchedMessages = messagesResponse.messages;
      } else if (Array.isArray(messagesResponse.data?.messages)) {
        fetchedMessages = messagesResponse.data.messages;
      } else if (Array.isArray(messagesResponse.data) && messagesResponse.data.length > 0 && messagesResponse.data[0].message_text) {
        fetchedMessages = messagesResponse.data;
      }
      
      // Handle matches response
      let fetchedMatches: ConversationMatch[] = [];
      if (Array.isArray(matchesResponse.matches)) {
        fetchedMatches = matchesResponse.matches;
      } else if (Array.isArray(matchesResponse.data?.matches)) {
        fetchedMatches = matchesResponse.data.matches;
      }
      
      console.log('[ChatScreen] Loaded chat data:', {
        messagesCount: fetchedMessages.length,
        matchesCount: fetchedMatches.length,
        conversationId: conversation.id,
      });
      
      // Sort messages by created_at to ensure chronological order
      const sortedMessages = [...fetchedMessages].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setMessages(sortedMessages);
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('[ChatScreen] Failed to load chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages and matches when conversation changes
  useEffect(() => {
    if (conversation?.id && token) {
      loadChatData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id, token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending || !conversation?.id || !token) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistically add message to UI
    const tempMessage: ApiMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversation.id,
      sender_id: String(user?.id || ''),
      receiver_id: String(conversation.other_user?.id || ''),
      message_text: messageText,
      created_at: new Date().toISOString(),
      sender: user ? {
        id: String(user.id),
        username: user.username || '',
        profile_photo: user.profile_photo,
      } : undefined,
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await apiFetch<{ message: ApiMessage }>(
        ENDPOINTS.messages.create,
        {
          method: 'POST',
          token,
          body: {
            conversation_id: conversation.id,
            message_text: messageText,
          },
        }
      );

      // Replace temp message with real message from server
      const savedMessage = response.message || response.data?.message;
      if (savedMessage) {
        setMessages((prev) => 
          prev.map((msg) => 
            msg.id === tempMessage.id ? savedMessage : msg
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      // Restore input text
      setInputText(messageText);
      alert(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader onBack={onBack} className="shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Loading...</h1>
        </AppHeader>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading messages...</div>
        </div>
      </div>
    );
  }

  // Show error if no conversation
  if (!conversation) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader onBack={onBack} className="shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Chat</h1>
        </AppHeader>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">No conversation selected</div>
        </div>
      </div>
    );
  }

  const otherUser = conversation.other_user || {};
  const otherUserName = otherUser.username || 'Unknown User';
  const otherUserAvatar = (() => {
    const profilePhoto = otherUser.profile_photo;
    if (!profilePhoto || profilePhoto.trim() === '') {
      return generateInitialsAvatar(otherUserName);
    }
    // Filter out generated avatars
    const generatedAvatarPatterns = [
      'ui-avatars.com',
      'pravatar.cc',
      'i.pravatar.cc',
      'robohash.org',
      'dicebear.com',
      'avatar.vercel.sh',
    ];
    const isGeneratedAvatar = generatedAvatarPatterns.some(pattern => 
      profilePhoto.toLowerCase().includes(pattern.toLowerCase())
    );
    return isGeneratedAvatar ? generateInitialsAvatar(otherUserName) : profilePhoto;
  })();

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader 
        onBack={onBack}
        className="shadow-sm"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-100 mr-2">
            <img src={otherUserAvatar} alt={otherUserName} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">{otherUserName}</h1>
        </div>
      </AppHeader>

      {/* Show Trade Match Card if there are matches */}
      {matches.length > 0 && matches[0] && (
        <TradeMatchCard 
          yourItem={matches[0].my_item?.title || matches[0].item1_title || 'Your item'}
          theirItem={matches[0].their_item?.title || matches[0].item2_title || 'Their item'}
          yourItemImage={matches[0].my_item?.image}
          theirItemImage={matches[0].their_item?.image}
          date={new Date(matches[0].created_at).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })}
        />
      )}

      {/* Show Item Card if no matches but conversation has item context */}
      {matches.length === 0 && conversation?.item && (
        <ItemCard 
          item={conversation.item}
          label="Item"
        />
      )}

      {/* Chat Messages */}
      <MessageList 
        messages={messages.map((msg) => ({
          id: msg.id,
          sender: String(msg.sender_id) === String(user?.id) ? 'me' : 'other',
          text: msg.message_text,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: msg.created_at, // Pass full date for grouping
        }))} 
      />

      {/* Input Area */}
      <MessageInput 
        value={inputText}
        onChange={setInputText}
        onSubmit={handleSend}
      />
    </div>
  );
};