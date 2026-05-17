import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface StatusIndicatorProps {
  active: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  active, 
  size = 'md' 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 8;
      case 'lg': return 16;
      default: return 12;
    }
  };

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.indicator, 
          { 
            backgroundColor: active ? '#51CF66' : '#FF6B6B',
            width: getSize(),
            height: getSize(),
          }
        ]} 
      />
      <Text style={[
        styles.label,
        { color: active ? '#51CF66' : '#FF6B6B' }
      ]}>
        {active ? 'Connected' : 'Disconnected'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    borderRadius: 50,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default StatusIndicator;