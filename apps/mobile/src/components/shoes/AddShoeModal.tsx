import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { X } from 'lucide-react-native';
import { useColors } from '../../hooks/useColors';
import { useTokens } from '../../hooks/useTokens';
import { supabase } from '../../services/database/supabase';

interface AddShoeModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (shoeData: any) => void;
}

export default function AddShoeModal({ visible, onClose, onAdd }: AddShoeModalProps) {
  const colors = useColors();
  const tokens = useTokens();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [replacementThreshold, setReplacementThreshold] = useState('400');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setPurchaseDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const handleAdd = async () => {
    if (!brand.trim() || !model.trim()) {
      Alert.alert('Error', 'Please enter brand and model');
      return;
    }

    try {
      setLoading(true);
      const shoeData = {
        brand: brand.trim(),
        model: model.trim(),
        purchase_date: purchaseDate.toISOString().split('T')[0],
        replacement_threshold: parseFloat(replacementThreshold) || 400,
        notes: notes.trim(),
        is_active: true,
      };

      await onAdd(shoeData);
      
      // Reset form
      setBrand('');
      setModel('');
      setPurchaseDate(new Date());
      setReplacementThreshold('400');
      setNotes('');
    } catch (error) {
      console.error('Error adding shoe:', error);
      Alert.alert('Error', 'Failed to add shoe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderTopLeftRadius: tokens.borderRadius.xl,
            borderTopRightRadius: tokens.borderRadius.xl,
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.lg,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: tokens.spacing.lg,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text.primary,
              }}
            >
              Add New Shoe
            </Text>
            <Pressable onPress={onClose}>
              <X color={colors.text.secondary} size={24} />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView
            style={{ gap: tokens.spacing.md }}
            contentContainerStyle={{ gap: tokens.spacing.md }}
          >
            {/* Brand */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Brand
              </Text>
              <TextInput
                placeholder="e.g., Nike, Hoka, Brooks"
                value={brand}
                onChangeText={setBrand}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  color: colors.text.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                }}
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Model */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Model
              </Text>
              <TextInput
                placeholder="e.g., Pegasus 40, Clifton 9"
                value={model}
                onChangeText={setModel}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  color: colors.text.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                }}
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Purchase Date */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Purchase Date
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                }}
              >
                <Text style={{ color: colors.text.primary }}>
                  {purchaseDate.toLocaleDateString()}
                </Text>
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={purchaseDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Replacement Threshold */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Replacement Threshold (miles)
              </Text>
              <TextInput
                placeholder="400"
                value={replacementThreshold}
                onChangeText={setReplacementThreshold}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  color: colors.text.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                }}
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Notes */}
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.text.secondary,
                  marginBottom: 4,
                }}
              >
                Notes (optional)
              </Text>
              <TextInput
                placeholder="Add any notes about this shoe"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: tokens.borderRadius.md,
                  padding: tokens.spacing.md,
                  color: colors.text.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  textAlignVertical: 'top',
                }}
                placeholderTextColor={colors.text.secondary}
              />
            </View>

            {/* Add Button */}
            <Pressable
              onPress={handleAdd}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: colors.accent.blue,
                borderRadius: tokens.borderRadius.md,
                padding: tokens.spacing.md,
                opacity: pressed || loading ? 0.7 : 1,
                marginTop: tokens.spacing.md,
              })}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {loading ? 'Adding...' : 'Add Shoe'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

