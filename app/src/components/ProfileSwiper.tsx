import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    Platform,
    TouchableOpacity,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.7;

interface Profile {
    id: string;
    name: string;
    profession: string;
    image: string;
    distance: string;
}

interface ProfileSwiperProps {
    profiles?: Profile[];
    onSwipeLeft?: (index: number) => void;
    onSwipeRight?: (index: number) => void;
    onSwipeTop?: (index: number) => void;
}


const ProfileSwiper: React.FC<ProfileSwiperProps> = ({
    profiles = [],
    onSwipeLeft,
    onSwipeRight,
    onSwipeTop,
}) => {
    const swiperRef = useRef<Swiper<Profile>>(null);
    const buttonScale = useSharedValue(1);

    // Placeholder data if no profiles provided
    const defaultProfiles: Profile[] = [
        {
            id: '1',
            name: 'Sarah Johnson',
            profession: 'Photographer',
            image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
            distance: '1 km',
        },
        {
            id: '2',
            name: 'Michael Chen',
            profession: 'Software Engineer',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            distance: '2.5 km',
        },
        {
            id: '3',
            name: 'Emma Wilson',
            profession: 'Graphic Designer',
            image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800',
            distance: '3 km',
        },
    ];

    const displayProfiles = profiles.length > 0 ? profiles : defaultProfiles;

    const handleButtonPress = (action: 'left' | 'right' | 'top') => {
        buttonScale.value = withSpring(0.9, {}, () => {
            buttonScale.value = withSpring(1);
        });

        if (swiperRef.current) {
            switch (action) {
                case 'left':
                    swiperRef.current.swipeLeft();
                    break;
                case 'right':
                    swiperRef.current.swipeRight();
                    break;
                case 'top':
                    // Note: react-native-deck-swiper doesn't support top swipe by default
                    // You may need to use a different library or custom implementation
                    swiperRef.current.swipeTop?.();
                    break;
            }
        }
    };

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    const renderCard = (profile: Profile) => {
        if (!profile) {
            return null;
        }

        return (
            <View style={styles.card}>
                <ImageBackground
                    source={{ uri: profile.image }}
                    style={styles.imageBackground}
                    imageStyle={styles.imageStyle}
                >
                    {/* Overlay gradient for better text readability */}
                    <View style={styles.overlay} />

                    {/* Distance badge - top left */}
                    <View style={styles.badge}>
                        <Ionicons name="location" size={14} color="#fff" />
                        <Text style={styles.badgeText}>{profile.distance}</Text>
                    </View>

                    {/* Name and profession - bottom left */}
                    <View style={styles.textContainer}>
                        <Text style={styles.name}>{profile.name}</Text>
                        <Text style={styles.profession}>{profile.profession}</Text>
                    </View>
                </ImageBackground>
            </View>
        );
    };

    const renderNoMoreCards = () => {
        return (
            <View style={styles.noMoreCards}>
                <Text style={styles.noMoreCardsText}>No more profiles</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Swiper
                ref={swiperRef}
                cards={displayProfiles}
                renderCard={renderCard}
                onSwipedLeft={(index) => {
                    onSwipeLeft?.(index);
                }}
                onSwipedRight={(index) => {
                    onSwipeRight?.(index);
                }}
                onSwipedTop={(index) => {
                    onSwipeTop?.(index);
                }}
                onSwipedAll={renderNoMoreCards}
                cardIndex={0}
                backgroundColor="transparent"
                stackSize={3}
                stackSeparation={15}
                cardVerticalMargin={0}
                cardHorizontalMargin={0}
                verticalSwipe={false}
                animateOverlayLabelsOpacity
                animateCardOpacity
                overlayLabels={{
                    left: {
                        title: 'NOPE',
                        style: {
                            label: {
                                backgroundColor: '#ff6b6b',
                                color: '#fff',
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
                        title: 'LIKE',
                        style: {
                            label: {
                                backgroundColor: '#4CAF50',
                                color: '#fff',
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
                    top: {
                        title: 'SUPER LIKE',
                        style: {
                            label: {
                                backgroundColor: '#2196F3',
                                color: '#fff',
                                fontSize: 24,
                                fontWeight: 'bold',
                                borderRadius: 10,
                                padding: 10,
                            },
                            wrapper: {
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                marginTop: 30,
                            },
                        },
                    },
                }}
            />

            {/* Floating action buttons - right center */}
            <View style={styles.floatingButtons}>
                <Animated.View style={buttonAnimatedStyle}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleButtonPress('left')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close" size={32} color="#ff6b6b" />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={buttonAnimatedStyle}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.starButton]}
                        onPress={() => handleButtonPress('top')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="star" size={32} color="#ffd93d" />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View style={buttonAnimatedStyle}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.likeButton]}
                        onPress={() => handleButtonPress('right')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="heart" size={32} color="#ff4f81" />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 25,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    imageBackground: {
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
        padding: 20,
    },
    imageStyle: {
        borderRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 25,
    },
    badge: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    textContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    name: {
        fontSize: 26,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    profession: {
        fontSize: 16,
        fontWeight: '400',
        color: '#fff',
        opacity: 0.8,
    },
    floatingButtons: {
        position: 'absolute',
        right: 20,
        top: '50%',
        transform: [{ translateY: -100 }],
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    rejectButton: {
        borderWidth: 2,
        borderColor: '#ff6b6b',
    },
    starButton: {
        borderWidth: 2,
        borderColor: '#ffd93d',
    },
    likeButton: {
        borderWidth: 2,
        borderColor: '#ff4f81',
    },
    noMoreCards: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMoreCardsText: {
        fontSize: 18,
        color: '#999',
    },
});

export default ProfileSwiper;

