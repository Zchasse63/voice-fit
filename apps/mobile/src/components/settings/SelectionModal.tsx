import React from 'react';
import { View, Text, Modal, Pressable, FlatList } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { tokens } from '../../theme/tokens';
import { Check } from 'lucide-react-native';

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: '80%',
            maxWidth: 400,
            backgroundColor: colors.background.primary,
            borderRadius: tokens.borderRadius.lg,
            overflow: 'hidden',
            ...tokens.shadows.xl,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              paddingVertical: tokens.spacing.md,
              paddingHorizontal: tokens.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: tokens.typography.fontSize.lg,
                fontWeight: tokens.typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {title}
            </Text>
          </View>

          {/* Options */}
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === selectedValue;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.value);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: tokens.spacing.md,
                    paddingHorizontal: tokens.spacing.lg,
                    backgroundColor: isSelected
                      ? colors.accent.blue + '10'
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: tokens.typography.fontSize.md,
                      color: isSelected ? colors.accent.blue : colors.text.primary,
                      fontWeight: isSelected
                        ? tokens.typography.fontWeight.semibold
                        : tokens.typography.fontWeight.regular,
                    }}
                  >
                    {item.label}
                  </Text>
                  {isSelected && <Check size={20} color={colors.accent.blue} />}
                </Pressable>
              );
            }}
          />

          {/* Cancel Button */}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border.light,
            }}
          >
            <Pressable
              onPress={onClose}
              style={{
                paddingVertical: tokens.spacing.md,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: tokens.typography.fontSize.md,
                  color: colors.text.secondary,
                  fontWeight: tokens.typography.fontWeight.semibold,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

