/**
 * Manual Nutrition Entry
 * 
 * Form to manually log daily nutrition data
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeContext";
import tokens from "../../theme/tokens";
import { supabase } from "../../services/supabase";

interface ManualNutritionEntryProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  date?: string;
  userId?: string;
}

export function ManualNutritionEntry({
  visible,
  onClose,
  onSuccess,
  date = new Date().toISOString().split("T")[0],
  userId,
}: ManualNutritionEntryProps) {
  const { isDark } = useTheme();
  const colors = tokens.colors[isDark ? "dark" : "light"];
  
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [sugar, setSugar] = useState("");
  const [sodium, setSodium] = useState("");
  const [water, setWater] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!calories || !protein || !carbs || !fat) {
      Alert.alert("Missing Fields", "Please fill in calories, protein, carbs, and fat");
      return;
    }

    try {
      setLoading(true);
      const response = await supabase.functions.invoke("log-nutrition", {
        body: {
          user_id: userId,
          date,
          calories: parseInt(calories),
          protein_g: parseFloat(protein),
          carbs_g: parseFloat(carbs),
          fat_g: parseFloat(fat),
          fiber_g: fiber ? parseFloat(fiber) : undefined,
          sugar_g: sugar ? parseFloat(sugar) : undefined,
          sodium_mg: sodium ? parseInt(sodium) : undefined,
          water_ml: water ? parseInt(water) : undefined,
          notes: notes || undefined,
        },
      });

      if (response.error) throw response.error;

      Alert.alert("Success", "Nutrition logged successfully");
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error logging nutrition:", error);
      Alert.alert("Error", "Failed to log nutrition");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setSugar("");
    setSodium("");
    setWater("");
    setNotes("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background.primary,
            borderTopLeftRadius: tokens.borderRadius.xl,
            borderTopRightRadius: tokens.borderRadius.xl,
            maxHeight: "90%",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: tokens.spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text.primary,
              }}
            >
              Log Nutrition
            </Text>
            <Pressable onPress={onClose}>
              <X color={colors.text.secondary} size={24} />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView
            contentContainerStyle={{
              padding: tokens.spacing.lg,
              gap: tokens.spacing.md,
            }}
          >
            <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
              Date: {date}
            </Text>

            {/* Required Fields */}
            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                Calories *
              </Text>
              <TextInput
                placeholder="e.g., 2150"
                value={calories}
                onChangeText={setCalories}
                keyboardType="number-pad"
                style={{
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Protein (g) *
                </Text>
                <TextInput
                  placeholder="165"
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="decimal-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Carbs (g) *
                </Text>
                <TextInput
                  placeholder="210"
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="decimal-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Fat (g) *
                </Text>
                <TextInput
                  placeholder="70"
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="decimal-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
            </View>

            {/* Optional Fields */}
            <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Fiber (g)
                </Text>
                <TextInput
                  placeholder="25"
                  value={fiber}
                  onChangeText={setFiber}
                  keyboardType="decimal-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Sugar (g)
                </Text>
                <TextInput
                  placeholder="45"
                  value={sugar}
                  onChangeText={setSugar}
                  keyboardType="decimal-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Sodium (mg)
                </Text>
                <TextInput
                  placeholder="2300"
                  value={sodium}
                  onChangeText={setSodium}
                  keyboardType="number-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                  Water (ml)
                </Text>
                <TextInput
                  placeholder="2000"
                  value={water}
                  onChangeText={setWater}
                  keyboardType="number-pad"
                  style={{
                    padding: tokens.spacing.md,
                    borderRadius: tokens.borderRadius.lg,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                />
              </View>
            </View>

            <View>
              <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 4 }}>
                Notes
              </Text>
              <TextInput
                placeholder="e.g., Ate out for lunch"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{
                  padding: tokens.spacing.md,
                  borderRadius: tokens.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => ({
                padding: tokens.spacing.md,
                borderRadius: tokens.borderRadius.lg,
                backgroundColor: colors.accent.blue,
                opacity: pressed || loading ? 0.8 : 1,
                alignItems: "center",
                marginTop: tokens.spacing.md,
              })}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Log Nutrition
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

