import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { commonStyles } from '../styles/theme';

interface RightButtonProps {
  name: string;
  lib: 'Ionicons' | 'MaterialCommunityIcons';
  onPress: () => void;
  color?: string;
}

interface DetailHeaderProps {
  title: string;
  onBackPress: () => void;
  rightButtons?: RightButtonProps[];
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({ title, onBackPress, rightButtons = [] }) => {
  return (
    <View style={commonStyles.header}>
      <View style={commonStyles.headerLeft}>
        <TouchableOpacity onPress={onBackPress} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>{title}</Text>
      </View>
      <View style={commonStyles.headerRight}>
        {rightButtons.map((btn, idx) => {
          const IconComp = btn.lib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
          return (
            <TouchableOpacity key={idx} onPress={btn.onPress} style={styles.iconButton}>
              <IconComp name={btn.name as any} size={22} color={btn.color ?? '#1E1E1E'} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 8,
  },
});
