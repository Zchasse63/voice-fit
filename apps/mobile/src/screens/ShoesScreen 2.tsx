import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { useColors } from '../hooks/useColors';
import { useTokens } from '../hooks/useTokens';
import { supabase } from '../services/database/supabase';
import ShoeCard from '../components/shoes/ShoeCard';
import AddShoeModal from '../components/shoes/AddShoeModal';

interface Shoe {
  id: string;
  brand: string;
  model: string;
  purchase_date: string;
  total_mileage: number;
  replacement_threshold: number;
  is_active: boolean;
  notes?: string;
}

export default function ShoesScreen() {
  const colors = useColors();
  const tokens = useTokens();
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadShoes();
  }, []);

  const loadShoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('running_shoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShoes(data || []);
    } catch (error) {
      console.error('Error loading shoes:', error);
      Alert.alert('Error', 'Failed to load shoes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShoe = (shoeId: string) => {
    Alert.alert('Delete Shoe', 'Are you sure you want to delete this shoe?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('running_shoes')
              .delete()
              .eq('id', shoeId);

            if (error) throw error;
            setShoes(shoes.filter(s => s.id !== shoeId));
          } catch (error) {
            console.error('Error deleting shoe:', error);
            Alert.alert('Error', 'Failed to delete shoe');
          }
        },
      },
    ]);
  };

  const handleAddShoe = async (shoeData: any) => {
    try {
      const { data, error } = await supabase
        .from('running_shoes')
        .insert([shoeData])
        .select();

      if (error) throw error;
      setShoes([data[0], ...shoes]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding shoe:', error);
      Alert.alert('Error', 'Failed to add shoe');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.text.primary,
          }}
        >
          Running Shoes
        </Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            backgroundColor: colors.accent.blue,
            padding: tokens.spacing.sm,
            borderRadius: tokens.borderRadius.md,
          })}
        >
          <Plus color="white" size={24} />
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.accent.blue} size="large" />
        </View>
      ) : shoes.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.text.secondary }}>No shoes yet</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.md }}
        >
          {shoes.map(shoe => (
            <ShoeCard
              key={shoe.id}
              shoe={shoe}
              onDelete={() => handleDeleteShoe(shoe.id)}
              onRefresh={loadShoes}
            />
          ))}
        </ScrollView>
      )}

      {/* Add Shoe Modal */}
      <AddShoeModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddShoe}
      />
    </View>
  );
}

