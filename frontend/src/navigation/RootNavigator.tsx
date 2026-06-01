import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { View, Text } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { AddPetScreen } from '../screens/main/AddPetScreen';

const Stack = createStackNavigator();

// 임시 화면 컴포넌트
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{route.params?.petName || 'Detail'} Screen</Text>
  </View>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddPet" component={AddPetScreen} options={{ title: '반려동물 등록' }} />
    <Stack.Screen name="PetDetail" component={PlaceholderScreen} options={({ route }: any) => ({ title: route.params?.petName })} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <NavigationContainer>
      {accessToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
