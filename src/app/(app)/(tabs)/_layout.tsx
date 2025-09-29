import { useMyProfile } from '@/api/my-profile';
import { TabBarProvider, useTabBar } from '@/context/tabBarContext';
import { cn } from '@/utils/cn';
import { Ionicons } from '@expo/vector-icons';
import { useConnection } from '@sendbird/uikit-react-native';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import colors from 'tailwindcss/colors';

const TabsComponent = () => {
  const { tabBarOpacity } = useTabBar();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          backgroundColor: '#000000',
          overflow: 'hidden',
          opacity: tabBarOpacity,
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={80}
            style={{
              flex: 1,
              height: '100%',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          />
        ),
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.neutral[500],
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: '100%',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size + 5} />
          ),
          headerTitle: '',
          headerShadowVisible: false,
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" color={color} size={size + 5} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbox-outline" color={color} size={size + 5} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="lovana"
        options={{
          tabBarIcon: ({ color, size, focused }) => {
            const { data: profile } = useMyProfile();
            return profile && profile.avatar_url ? (
              <View
                style={{
                  width: size + 5,
                  height: size + 5,
                }}
                className={cn(
                  focused && 'border border-white rounded-full p-0.5'
                )}
              >
                <Image
                  source={profile.avatar_url}
                  className="flex-1 aspect-square rounded-full bg-neutral-200"
                />
              </View>
            ) : (
              <Ionicons name="person-circle" color={color} size={size + 5} />
            );
          },
        }}
      />
    </Tabs>
  );
};

export default function Layout() {
  const { data: profile } = useMyProfile();
  const { connect } = useConnection();

  useEffect(() => {
    if (profile) {
      connect(profile.id, { nickname: profile.first_name || undefined });
    }
  }, [profile, connect]);

  return (
    <TabBarProvider>
      <TabsComponent />
    </TabBarProvider>
  );
}
