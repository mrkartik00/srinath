import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Logo — the Janki Care mark (four-petal medical cross), matching the SVG
 * used in the client website's navbar/hero header exactly, so the app and
 * website present the same brand icon.
 */
export default function Logo({ size = 24, color = '#223263', strokeWidth = 2.5 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C10.5 2 9 3.5 9 5c0 1.5 1.5 3 3 3s3-1.5 3-3c0-1.5-1.5-3-3-3z" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 22C13.5 22 15 20.5 15 19c0-1.5-1.5-3-3-3s-3 1.5-3 3c0 1.5 1.5 3 3 3z" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M2 12C2 13.5 3.5 15 5 15c1.5 0 3-1.5 3-3S6.5 9 5 9c-1.5 0-3 1.5-3 3z" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M22 12C22 10.5 20.5 9 19 9c-1.5 0-3 1.5-3 3s1.5 3 3 3c1.5 0 3-1.5 3-3z" stroke={color} strokeWidth={strokeWidth} />
      <Path d="M12 9v6M9 12h6" stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}
