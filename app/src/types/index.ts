export interface ApiUser {
    id: string;
    phone?: string;
    email?: string;
    email_verified_at?: string | null;
    phone_verified_at?: string | null;
    username: string;
    bio?: string | null;
    profile_photo?: string | null;
    city: string;
    role: string;
    otp_verified_at?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    location_updated_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Item {
    id?: string;
    item_id?: string;
    user_id: string;
    title: string;
    description: string;
    category: string;
    condition: 'new' | 'like_new' | 'used';
    photos: string[];
    looking_for: string;
    city: string;
    status: 'active' | 'swapped';
    created_at?: string;
    owner?: ApiUser;
    user?: ApiUser;
    distance_km?: number | null; // Distance in kilometers
    distance_miles?: number | null; // Distance in miles
}

export interface SwipeHistory {
    swipe_id: string;
    from_user_id: string;
    target_item_id: string;
    direction: 'right' | 'left';
    created_at: string;
}

export interface Match {
    match_id?: string;
    id?: string;
    user1_id: string;
    user2_id: string;
    item1_id: string;
    item2_id: string;
    created_at?: string;
    user1?: ApiUser;
    user2?: ApiUser;
    item1?: Item;
    item2?: Item;
}

export interface Message {
    message_id?: string;
    id?: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    message_text: string;
    timestamp?: string;
    created_at?: string;
    sender?: ApiUser;
    receiver?: ApiUser;
}

export interface Conversation {
    id: string;
    conversation_id: string;
    other_user: ApiUser;
    last_message?: {
        id: string;
        message_text: string;
        sender_id: string;
        created_at: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface ConversationMatch {
    id: string;
    item1_title: string;
    item2_title: string;
    my_item: Item;
    their_item: Item;
    created_at: string;
}

export interface MatchRequest {
    id: string;
    from_user: ApiUser;
    target_item: Item; // The user's item that was swiped on
    offered_item?: Item; // The item being offered in exchange (from trade offer)
    other_user_items: Item[];
    is_matched?: boolean;
    created_at: string;
}

export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    PhoneLogin?: undefined;
    OTPVerification?: { phoneNumber: string };
    AccountSetup?: { phoneNumber: string };
    ProfileSetup?: undefined;
    MainTabs: undefined;
    ItemDetails: { item: Item };
    Chat: { conversation: Conversation };
    EditProfile: undefined;
    UpdatePassword: undefined;
    MatchRequests: undefined;
    TermsOfUse: undefined;
    PrivacyPolicy: undefined;
    UserProfile: { userId: string; user?: ApiUser };
};

export type MainTabParamList = {
    SwipeFeed: undefined;
    UploadItem: undefined;
    Matches: undefined;
    Profile: undefined;
};

/**
 * Nearby user with distance information
 */
export interface NearbyUser {
    id: string;
    username: string;
    bio?: string | null;
    profile_photo?: string | null;
    city: string;
    distance: number; // Distance in kilometers
    distance_miles: number; // Distance in miles
    created_at?: string;
}

/**
 * Location status response
 */
export interface LocationStatus {
    has_location: boolean;
    latitude: number | null;
    longitude: number | null;
    location_updated_at: string | null;
    location_age_hours: number | null;
}

/**
 * Nearby users response
 */
export interface NearbyUsersResponse {
    users: NearbyUser[];
    total: number;
    radius_km: number;
    radius_miles: number;
    center: {
        latitude: number;
        longitude: number;
    };
}
