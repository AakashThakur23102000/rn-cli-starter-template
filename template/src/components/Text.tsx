import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useAppSelector } from '../hooks/storeHooks';
import { fontFamily } from '../config/fontFamily';
import { fontSize } from '../config/fontSize';

const Text = ({ style, children, ...props }: TextProps) => {
  const colors = useAppSelector((state) => state.theme.colors);

  return (
    <RNText
      {...props}
      style={[
        {
          color: colors.textColor,
          fontFamily: fontFamily.WixMadeforText.normal,
          fontSize: fontSize.regular
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

export default Text;
