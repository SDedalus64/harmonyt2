import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FieldWithInfoProps extends TextInputProps {
  placeholder: string;
  inputRef?: React.RefObject<TextInput>;
}

const FieldWithInfo: React.FC<FieldWithInfoProps> = ({
  placeholder,
  inputRef,
  ...textInputProps
}) => (
  <View style={styles.inputGroup}>
    <TextInput
      ref={inputRef}
      placeholder={placeholder}
      style={styles.input}
      {...textInputProps}
    />
  </View>
);

const styles = StyleSheet.create({
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
  },
});

export default FieldWithInfo;