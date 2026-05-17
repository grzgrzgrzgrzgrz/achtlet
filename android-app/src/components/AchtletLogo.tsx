import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface AchtletLogoProps {
  size?: number;
  className?: string;
}

const AchtletLogo: React.FC<AchtletLogoProps> = ({ size = 48 }) => {
  return (
    <Image
      source={require('../../assets/achtlet_logo.png')}
      style={[
        styles.logo,
        {
          width: size,
          height: size,
        }
      ]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    borderRadius: 8, // Add slight border radius to match modern design
  },
});

export default AchtletLogo;
