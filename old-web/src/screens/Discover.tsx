import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Filter, MapPin, X, Check, Info, Share2 } from 'lucide-react';

/**
 * Discover Screen
 * Main feed with swipeable item cards
 */
const Discover = () => {
  const [selectedCategory] = useState('All Categories');
  const [selectedLocation] = useState('Abuja');
  const [activeTab, setActiveTab] = useState<'barter' | 'marketplace'>('barter');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);

  // Mock data - replace with API call later
  const items = [
    {
      id: 1,
      title: 'Phone holder',
      description: 'Phone holder against flat wall or surface area',
      condition: 'Like New',
      lookingFor: 'Weed',
      seller: {
        name: 'Ebuka',
        location: 'Abuja',
        distance: '30m',
      },
      image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=500&fit=crop',
    },
    {
      id: 2,
      title: 'iPhone 13 Pro',
      description: 'Brand new iPhone 13 Pro, unopened box',
      condition: 'New',
      lookingFor: 'MacBook',
      seller: {
        name: 'Sarah',
        location: 'Lagos',
        distance: '45m',
      },
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=500&fit=crop',
    },
    {
      id: 3,
      title: 'Gaming Chair',
      description: 'Ergonomic gaming chair with lumbar support',
      condition: 'Good',
      lookingFor: 'Monitor',
      seller: {
        name: 'Mike',
        location: 'Abuja',
        distance: '1h',
      },
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=500&fit=crop',
    },
    {
      id: 4,
      title: 'Camera Lens',
      description: 'Canon 50mm f/1.8 prime lens, excellent condition',
      condition: 'Like New',
      lookingFor: 'Tripod',
      seller: {
        name: 'David',
        location: 'Port Harcourt',
        distance: '2h',
      },
      image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=500&fit=crop',
    },
    {
      id: 5,
      title: 'Designer Watch',
      description: 'Vintage watch, fully functional',
      condition: 'Good',
      lookingFor: 'Sunglasses',
      seller: {
        name: 'Emma',
        location: 'Abuja',
        distance: '15m',
      },
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=500&fit=crop',
    },
  ];

  const currentItem = items[currentIndex];
  const visibleCards = items.slice(currentIndex, currentIndex + 3); // Show 3 cards in stack

  const handleSwipe = (direction: 'left' | 'right') => {
    if (swiping || currentIndex >= items.length) return;
    
    setSwiping(true);
    
    // Move to next card after animation
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwiping(false);
    }, 300);
  };

  const handleShare = async (item: typeof items[0]) => {
    try {
      // Create shareable URL
      const shareUrl = `${window.location.origin}/items/${item.id}`;
      
      // Use Web Share API if available, otherwise fallback to clipboard
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Item link copied to clipboard!');
      }
    } catch (err: any) {
      // User cancelled share or error occurred
      if (err.name !== 'AbortError') {
        console.error('Failed to share item:', err);
      }
    }
  };

  const getCardStyle = (index: number) => {
    const offset = index;
    const scale = 1 - offset * 0.05;
    const yOffset = offset * 8;
    const zIndex = 10 - offset;
    const opacity = 1 - offset * 0.15;

    return {
      transform: `translateY(${yOffset}px) scale(${scale})`,
      zIndex,
      opacity: opacity < 0.3 ? 0.3 : opacity,
    };
  };

  return (
    <MainLayout>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header Section */}
        <div
          style={{
            flexShrink: 0,
            backgroundColor: '#FFFFFF',
            paddingTop: '12px',
            paddingBottom: '0',
            paddingLeft: '20px',
            paddingRight: '20px',
            borderBottom: '1px solid #E0E0E0',
          }}
        >
          {/* Title - Centered */}
          <h1
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#222222',
              lineHeight: '1.2',
              margin: 0,
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            Discover
          </h1>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E0E0E0',
              marginLeft: '-20px',
              marginRight: '-20px',
            }}
          >
            <button
              onClick={() => setActiveTab('barter')}
              type="button"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'barter' ? '2px solid #990033' : '2px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'barter' ? '600' : '400',
                color: activeTab === 'barter' ? '#990033' : '#999999',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Barter
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              type="button"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'marketplace' ? '2px solid #990033' : '2px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'marketplace' ? '600' : '400',
                color: activeTab === 'marketplace' ? '#990033' : '#999999',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Marketplace
            </button>
          </div>
        </div>

        {/* Filter Badges Section - Above Card */}
        <div
          style={{
            flexShrink: 0,
            paddingTop: '8px',
            paddingBottom: '12px',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* Category Badge - Left */}
          <button
            onClick={() => console.log('Open categories')}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              fontSize: '12px',
              fontWeight: '600',
              color: '#222222',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            <Filter size={13} />
            <span>{selectedCategory}</span>
          </button>

          {/* Location Badge - Right */}
          <button
            onClick={() => console.log('Open locations')}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              fontSize: '12px',
              fontWeight: '600',
              color: '#222222',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            <MapPin size={13} />
            <span>{selectedLocation}</span>
          </button>
        </div>
      </div>

        {/* Main Card Container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0px 16px 12px 16px',
            gap: '16px',
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Card Stack */}
          {currentIndex < items.length ? (
            visibleCards.map((item, stackIndex) => {
              const isTopCard = stackIndex === 0;
              const cardStyle = getCardStyle(stackIndex);
              const isSwiping = swiping && isTopCard;
              
              return (
                <div
                  key={item.id}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '20px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    position: stackIndex === 0 ? 'relative' : 'absolute',
                    top: stackIndex === 0 ? 'auto' : '0',
                    left: stackIndex === 0 ? 'auto' : '50%',
                    transform: stackIndex === 0 
                      ? (isSwiping ? 'translateX(0) translateY(0) scale(1)' : 'translateX(0) translateY(0) scale(1)')
                      : `translateX(-50%) ${cardStyle.transform}`,
                    zIndex: cardStyle.zIndex,
                    opacity: cardStyle.opacity,
                    transition: isSwiping ? 'transform 0.3s ease-out, opacity 0.3s ease-out' : 'none',
                    pointerEvents: isTopCard ? 'auto' : 'none',
                  }}
                >
          {/* Product Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '5/4',
              backgroundColor: '#F5F5F5',
              overflow: 'hidden',
            }}
          >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#FF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Info size={14} color="#FFFFFF" />
            </button>
          </div>

          {/* Product Details */}
          <div style={{ padding: '16px 18px' }}>
            {/* Title and Condition */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '8px',
                gap: '10px',
              }}
            >
                    <h2
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#222222',
                        flex: 1,
                        lineHeight: '1.3',
                        margin: 0,
                      }}
                    >
                      {item.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#E8F5E9',
                          color: '#2E7D32',
                          whiteSpace: 'nowrap',
                          letterSpacing: '0.3px',
                          border: 'none',
                        }}
                      >
                        {item.condition}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item);
                        }}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'transparent',
                          border: '1px solid #E0E0E0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F5F5F5';
                          e.currentTarget.style.borderColor = '#CCCCCC';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = '#E0E0E0';
                        }}
                      >
                        <Share2 size={14} color="#666666" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#666666',
                      marginBottom: '12px',
                      lineHeight: '1.5',
                      marginTop: 0,
                      paddingLeft: 0,
                    }}
                  >
                    {item.description}
                  </p>

                  {/* Looking For */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>↻</span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#222222',
                        flex: 1,
                        lineHeight: '1.4',
                      }}
                    >
                      Looking for: {item.lookingFor}
                    </span>
                    <span style={{ fontSize: '14px', lineHeight: '1' }}>🍁</span>
                  </div>

                  {/* Seller Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '0',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#E0E0E0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#666666',
                        }}
                      >
                        {item.seller.name.charAt(0)}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#222222',
                          marginBottom: '2px',
                          lineHeight: '1.3',
                        }}
                      >
                        {item.seller.name}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <MapPin size={10} color="#999999" />
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#999999',
                          }}
                        >
                          {item.seller.location}
                        </span>
                        <span style={{ color: '#999999', margin: '0 2px' }}>•</span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#999999',
                          }}
                        >
                          {item.seller.distance}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px 20px',
                textAlign: 'center',
                color: '#999999',
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                No more items
              </p>
              <p style={{ fontSize: '14px' }}>
                Check back later for new items!
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Below Card */}
        {currentIndex < items.length && (
          <div
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px',
              width: '100%',
              maxWidth: '400px',
              paddingTop: '8px',
              zIndex: 1000,
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => handleSwipe('left')}
              disabled={swiping}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: swiping ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(255, 68, 68, 0.25)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: swiping ? 0.6 : 1,
              }}
              onMouseDown={(e) => {
                if (!swiping) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={28} color="#FF4444" strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={() => handleSwipe('right')}
              disabled={swiping}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: swiping ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: swiping ? 0.6 : 1,
              }}
              onMouseDown={(e) => {
                if (!swiping) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Check size={28} color="#FFFFFF" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Discover;

