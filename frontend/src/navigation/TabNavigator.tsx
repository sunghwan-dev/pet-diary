import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/main/HomeScreen';
import { TodoScreen } from '../screens/main/TodoScreen';
import { MedicalScreen } from '../screens/main/MedicalScreen';
import { ExpensesScreen } from '../screens/main/ExpensesScreen';


const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  name: string;
  label: string;
  iconType: 'Ionicons' | 'MaterialCommunityIcons';
}

const TabIcon = ({ focused, name, label, iconType }: TabIconProps) => {
  const IconComponent = iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;

  return (
    <View style={styles.tabItem}>
      {focused ? (
        <View style={styles.activeIconContainer}>
          <IconComponent name={name as any} size={22} color="#1E1E1E" />
        </View>
      ) : (
        <IconComponent name={name as any} size={24} color="#A2A2A2" />
      )}
      {focused ? <Text style={styles.activeLabel}>{label}</Text> : null}
    </View>
  );
};

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="PetsTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="paw"
              label="Pets"
              iconType="MaterialCommunityIcons"
            />
          ),
        }}
      />
      <Tab.Screen
        name="TodoTab"
        component={TodoScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="calendar"
              label="Todo"
              iconType="Ionicons"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MedicalTab"
        component={MedicalScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="medkit"
              label="Medical"
              iconType="Ionicons"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="wallet"
              label="Expenses"
              iconType="MaterialCommunityIcons"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F5ECE1',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#C4A48A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderTopLeftRadius: 24, // 내비게이션 바 상단 둥글게 처리
    borderTopRightRadius: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    width: 64,
  },
  activeIconContainer: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFE5D9', // 활성화 타원 살구색 배경
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3C2F2F',
  },
});
