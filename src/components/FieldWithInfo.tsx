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
  ...textInputProps
}) => {
  const showIcon = isTablet();
  return (
    <View style={styles.inputGroup}>
      {showIcon && fieldKey && onInfoPress && (
        <TouchableOpacity onPress={() => onInfoPress(fieldKey)} style={styles.icon}>
          <Ionicons name="information-circle-outline" size={22} color="#217DB2" />
        </TouchableOpacity>
      )}
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        style={styles.input}
        {...textInputProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
});

export default FieldWithInfo;