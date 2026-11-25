import { Image } from 'react-native';

/** Folder mark extracted from the supplied sign-in artwork. */
export function Logo({ size = 101 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/unifyle-logo.png')}
      style={{ width: size, height: (size * 84) / 101 }}
      resizeMode="contain"
      accessibilityLabel="UniFyle logo"
    />
  );
}
