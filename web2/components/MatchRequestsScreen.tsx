import React, { useState, useEffect } from 'react';
import { Heart, User, MapPin, Clock, CheckCircle2, XCircle, Loader2, MessageSquare, ShoppingBag } from 'lucide-react';
import { AppHeader } from './AppHeader';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import { ENDPOINTS } from '../constants/endpoints';
import { generateInitialsAvatar } from '../constants/placeholders';

interface MatchRequestsScreenProps {
  onBack: () => void;
}

interface TradeOffer {
  id: number;
  type: 'trade_offer';
  from_user: {
    id: number;
    username: string;
    photo: string | null;
    city: string | null;
  };
  target_item: {
    id: number;
    title: string;
    photo: string | null;
  };
  offered_item: {
    id: number;
    title: string;
    photo: string | null;
  };
  status: string;
  created_at: string;
}

interface MessageRequest {
  id: number;
  type: 'message_request';
  from_user: {
    id: number;
    username: string;
    photo: string | null;
    city: string | null;
  };
  item: {
    id: number;
    title: string;
    photo: string | null;
  };
  message_text: string;
  status: string;
  created_at: string;
}

type Request = TradeOffer | MessageRequest;

export const MatchRequestsScreen: React.FC<MatchRequestsScreenProps> = ({ onBack }) => {
  const { token, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadRequests();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadRequests = async () => {
    if (!token) return;
    
    try {
      setRefreshing(true);
      
      // Fetch both trade offers and message requests in parallel
      const [tradeOffersRes, messageRequestsRes] = await Promise.all([
        apiFetch(ENDPOINTS.tradeOffers.pending, { token }).catch(err => {
          console.error('Error fetching trade offers:', err);
          return { offers: [] };
        }),
        apiFetch(ENDPOINTS.messageRequests.pending, { token }).catch(err => {
          console.error('Error fetching message requests:', err);
          return { requests: [] };
        }),
      ]);
      
      console.log('Trade Offers Response:', tradeOffersRes);
      console.log('Message Requests Response:', messageRequestsRes);
      
      // Combine both types of requests
      const tradeOffers: TradeOffer[] = (tradeOffersRes.offers || []).map((offer: any) => ({
        ...offer,
        type: 'trade_offer' as const,
      }));
      
      const messageRequests: MessageRequest[] = (messageRequestsRes.requests || []).map((req: any) => ({
        ...req,
        type: 'message_request' as const,
      }));
      
      // Sort by created_at (newest first)
      const allRequests = [...tradeOffers, ...messageRequests].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      
      setRequests(allRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRespond = async (requestId: number, requestType: 'trade_offer' | 'message_request', decision: 'accept' | 'decline') => {
    if (!token) return;
    
    setProcessingId(requestId);
    try {
      const endpoint = requestType === 'trade_offer' 
        ? ENDPOINTS.tradeOffers.respond(requestId)
        : ENDPOINTS.messageRequests.respond(requestId);
      
      const response = await apiFetch(endpoint, {
        token,
        method: 'POST',
        body: { decision },
      });
      
      console.log('Request response:', response);
      
      // Reload requests after responding
      await loadRequests();
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Failed to respond to request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader title="Match Requests" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
          <div className="mb-6">
            <Heart size={64} className="text-gray-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Sign In Required</h2>
          <p className="text-gray-500 max-w-[240px] leading-relaxed">
            Please sign in to view your match requests.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <AppHeader title="Match Requests" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <AppHeader title="Match Requests" onBack={onBack} />

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {requests.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="mb-6">
              <Heart size={64} className="text-gray-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">No match requests</h2>
            <p className="text-gray-500 max-w-[240px] leading-relaxed">
              When someone swipes right on your items, you'll see them here! 🎉
            </p>
          </div>
        ) : (
          /* Requests List */
          <div className="p-4 space-y-4">
            {requests.map((request) => {
              const isTradeOffer = request.type === 'trade_offer';
              const isProcessing = processingId === request.id;
              
              return (
                <div
                  key={`${request.type}-${request.id}`}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {request.from_user.photo ? (
                        <img
                          src={request.from_user.photo}
                          alt={request.from_user.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = generateInitialsAvatar(request.from_user.username);
                          }}
                        />
                      ) : (
                        <img
                          src={generateInitialsAvatar(request.from_user.username)}
                          alt={request.from_user.username}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 truncate">
                          {request.from_user.username}
                        </h3>
                        {isTradeOffer ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Heart size={10} />
                            Trade
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <MessageSquare size={10} />
                            Message
                          </span>
                        )}
                      </div>
                      {request.from_user.city && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin size={12} />
                          <span className="truncate">{request.from_user.city}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatTime(request.created_at)}</span>
                    </div>
                  </div>

                  {isTradeOffer ? (
                    /* Trade Offer Content */
                    <>
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Trade Offer
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Their Offered Item */}
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">They're offering:</div>
                            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                              <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-100 mb-2">
                                {request.offered_item.photo ? (
                                  <img
                                    src={request.offered_item.photo}
                                    alt={request.offered_item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Heart size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {request.offered_item.title}
                              </div>
                            </div>
                          </div>

                          {/* Arrow */}
                          <div className="text-gray-400 shrink-0">
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          </div>

                          {/* Your Target Item */}
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">For your item:</div>
                            <div className="bg-brand/5 rounded-lg p-2 border border-brand/20">
                              <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-100 mb-2">
                                {request.target_item.photo ? (
                                  <img
                                    src={request.target_item.photo}
                                    alt={request.target_item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <Heart size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {request.target_item.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Message Request Content */
                    <>
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Buy Request
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                          <div className="text-sm text-gray-700 mb-2">{request.message_text}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">For your item:</div>
                            <div className="bg-brand/5 rounded-lg p-2 border border-brand/20">
                              <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-100 mb-2">
                                {request.item.photo ? (
                                  <img
                                    src={request.item.photo}
                                    alt={request.item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <ShoppingBag size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {request.item.title}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespond(request.id, request.type, 'decline')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle size={18} />
                          <span>Decline</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleRespond(request.id, request.type, 'accept')}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};