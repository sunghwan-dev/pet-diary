import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { View, Text } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { TabNavigator } from './TabNavigator';
import { AddPetScreen } from '../screens/main/AddPetScreen';
import { PetDetailScreen } from '../screens/main/PetDetailScreen';
import { AddAppointmentScreen } from '../screens/main/AddAppointmentScreen';
import { AppointmentDetailScreen } from '../screens/main/AppointmentDetailScreen';
import { EditAppointmentScreen } from '../screens/main/EditAppointmentScreen';
import { AddRoutineScreen } from '../screens/main/AddRoutineScreen';
import { RoutineDetailScreen } from '../screens/main/RoutineDetailScreen';
import { EditRoutineScreen } from '../screens/main/EditRoutineScreen';
import { AddMedicalRecordScreen } from '../screens/main/AddMedicalRecordScreen';
import { MedicalRecordDetailScreen } from '../screens/main/MedicalRecordDetailScreen';
import { EditMedicalRecordScreen } from '../screens/main/EditMedicalRecordScreen';
import { AddExpenseScreen } from '../screens/main/AddExpenseScreen';
import { ExpenseDetailScreen } from '../screens/main/ExpenseDetailScreen';
import { EditExpenseScreen } from '../screens/main/EditExpenseScreen';
import { navigationRef } from '../api/client';

const Stack = createStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);

const MainNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="AddPet" component={AddPetScreen} options={{ headerShown: false }} />
    <Stack.Screen name="PetDetail" component={PetDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddAppointment" component={AddAppointmentScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditAppointment" component={EditAppointmentScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddRoutine" component={AddRoutineScreen} options={{ headerShown: false }} />
    <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditRoutine" component={EditRoutineScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddMedicalRecord" component={AddMedicalRecordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MedicalRecordDetail" component={MedicalRecordDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditMedicalRecord" component={EditMedicalRecordScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export const RootNavigator = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <NavigationContainer ref={navigationRef}>
      {accessToken ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
