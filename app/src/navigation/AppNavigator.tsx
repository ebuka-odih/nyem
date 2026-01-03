import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from '../screens/LoginScreen';

// Import screens (we'll create these next)
import WelcomeScreen from '../screens/WelcomeScreen';
import PhoneLoginScreen from '../screens/PhoneLoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import SwipeFeedScreen from '../screens/SwipeFeedScreen';
import UploadItemScreen from '../screens/UploadItemScreen';
import MatchListScreen from '../screens/MatchListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ItemDetailsScreen from '../screens/ItemDetailsScreen';
import AccountSetupScreen from '../screens/AccountSetupScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';
import MatchRequestScreen from '../screens/MatchRequestScreen';
import TermsOfUseScreen from '../screens/TermsOfUseScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    const insets = useSafeAreaInsets();
    const bottomPadding = Platform.OS === 'ios'
        ? Math.max(insets.bottom, 10)
        : Platform.OS === 'web'
            ? 8
            : 5;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home';

                    if (route.name === 'SwipeFeed') {
                        iconName = focused ? 'flame' : 'flame-outline';
                    } else if (route.name === 'UploadItem') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Matches') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    backgroundColor: COLORS.secondary,
                    borderTopColor: COLORS.border,
                    borderTopWidth: 1,
                    paddingBottom: bottomPadding,
                    paddingTop: Platform.OS === 'web' ? 10 : 8,
                    height: Platform.OS === 'ios'
                        ? 60 + bottomPadding
                        : Platform.OS === 'web'
                            ? 70
                            : 60,
                },
                headerStyle: {
                    backgroundColor: COLORS.secondary,
                },
                headerTintColor: COLORS.textPrimary,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            })}
        >
            <Tab.Screen
                name="SwipeFeed"
                component={SwipeFeedScreen}
                options={{ title: 'Discover' }}
            />
            <Tab.Screen
                name="UploadItem"
                component={UploadItemScreen}
                options={{ title: 'Upload' }}
            />
            <Tab.Screen
                name="Matches"
                component={MatchListScreen}
                options={{ title: 'Matches' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useAuth();
    const isLoggedIn = Boolean(user);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: COLORS.secondary,
                    },
                    headerTintColor: COLORS.textPrimary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                {!isLoggedIn ? (
                    <>
                        <Stack.Screen
                            name="Welcome"
                            component={WelcomeScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Login"
                            component={LoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PhoneLogin"
                            component={PhoneLoginScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="OTPVerification"
                            component={OTPVerificationScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AccountSetup"
                            component={AccountSetupScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="TermsOfUse"
                            component={TermsOfUseScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PrivacyPolicy"
                            component={PrivacyPolicyScreen}
                            options={{ headerShown: false }}
                        />
                    </>
                ) : (
                    <>
                        <Stack.Screen
                            name="MainTabs"
                            component={MainTabs}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ItemDetails"
                            component={ItemDetailsScreen}
                            options={{ title: 'Item Details' }}
                        />
                        <Stack.Screen
                            name="Chat"
                            component={ChatScreen}
                            options={{ title: 'Chat' }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="UpdatePassword"
                            component={UpdatePasswordScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="MatchRequests"
                            component={MatchRequestScreen}
                            options={{ title: 'Match Requests' }}
                        />
                        <Stack.Screen
                            name="TermsOfUse"
                            component={TermsOfUseScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="PrivacyPolicy"
                            component={PrivacyPolicyScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="UserProfile"
                            component={UserProfileScreen}
                            options={{ title: 'Profile' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
