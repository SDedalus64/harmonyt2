import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FieldKey = 'code' | 'declared' | 'freight' | 'units';

interface FieldWithInfoProps extends TextInputProps {
  placeholder: string;
  fieldKey: FieldKey;
  onInfoPress: (field: FieldKey) => void;
  inputRef?: React.RefObject<TextInput>;
}

const FieldWithInfo: React.FC<FieldWithInfoProps> = ({
  placeholder,
  fieldKey,
  onInfoPress,
  inputRef,
  ...textInputProps
}) => (
  <View style={styles.inputGroup}>
    <TouchableOpacity onPress={() => onInfoPress(fieldKey)} style={styles.icon}>
      <Ionicons name="information-circle-outline" size={20} color="#217DB2" />
    </TouchableOpacity>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
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