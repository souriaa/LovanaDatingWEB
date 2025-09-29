import { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { Animated } from 'react-native';

type TabBarContextType = {
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  tabBarOpacity: Animated.Value;
};

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const tabBarOpacity = useRef(new Animated.Value(1)).current;

  const value: TabBarContextType = {
    isTabBarVisible,
    setTabBarVisible: setIsTabBarVisible,
    tabBarOpacity,
  };

  return (
    <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>
  );
};

export const useTabBar = (): TabBarContextType => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};
