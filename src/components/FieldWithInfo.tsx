import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isTablet } from '../config/brandColors';

interface FieldWithInfoProps extends TextInputProps {
  placeholder: string;
  inputRef?: React.RefObject<TextInput>;
  fieldKey?: 'code' | 'declared' | 'freight' | 'units';
  onInfoPress?: (field: 'code' | 'declared' | 'freight' | 'units') => void;
}

const FieldWithInfo: React.FC<FieldWithInfoProps> = ({
  placeholder,
  inputRef,
  fieldKey,
  onInfoPress,
  ...restProps
}) => {
  const showIconOnTablet = isTablet();
  const iconSize = showIconOnTablet ? 42 : 22;

  return (
    <View style={styles.inputGroup}>
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        style={styles.input}
        {...restProps}
      />

      {showIconOnTablet && fieldKey && onInfoPress && (
        <TouchableOpacity
          onPress={() => onInfoPress(fieldKey)}
          style={[styles.iconOverlay, { width: iconSize + 12 }]}
        >
          <Ionicons name="information-circle-outline" size={iconSize} color="#217DB2" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    position: 'relative',
    width: '100%',
  },
  iconOverlay: {
    position: 'absolute',
    left: -54,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -7 }],
  },
  input: {
    width: '100%',
    height: 44,
    fontSize: 16,
  },
});

export default FieldWithInfo;