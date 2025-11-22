import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch, Pressable } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { tokens } from "../theme/tokens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { SelectionModal } from "../components/settings/SelectionModal";
import { audioCueService } from "../services/AudioCueService";
// import { useRunStore } from "../store/run.store";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // TODO: Implement settings in RunStore
// @ts-ignore - RadioRow import not used due to commented settings section
// import { RadioRow } from "../components/settings/RadioRow"; // TODO: Implement settings in RunStore

export default function RunSettingsScreen() {
  const { isDark } = useTheme();
  const colors = isDark ? tokens.colors.dark : tokens.colors.light;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  // TODO: Implement settings and updateSettings in RunStore
  // const { settings, updateSettings } = useRunStore();

  // Audio Cues
  const [startStopCues, setStartStopCues] = useState(true);
  const [runSplits, setRunSplits] = useState(false);
  const [paceAlerts, setPaceAlerts] = useState(false);
  const [voice, setVoice] = useState("default");
  const [volume, setVolume] = useState("normal");

  // Modals
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);
  // const [countdownModalVisible, setCountdownModalVisible] = useState(false); // TODO: Implement settings in RunStore

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const audioSettings = audioCueService.getSettings();
    setStartStopCues(audioSettings.startStopCues);
    setRunSplits(audioSettings.runSplits);
    setPaceAlerts(audioSettings.paceAlerts);
    setVoice(audioSettings.voice);
    setVolume(audioSettings.volume);
  };

  const saveAudioSetting = async (key: string, value: any) => {
    await audioCueService.updateSettings({ [key]: value });
  };

  // TODO: Implement settings in RunStore
  /*
  const saveRunSetting = async (key: string, value: any) => {
    // TODO: Implement updateSettings in RunStore
    // updateSettings({ [key]: value });
    try {
      const stored = await AsyncStorage.getItem('runSettings');
      const current = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem('runSettings', JSON.stringify({ ...current, [key]: value }));
    } catch (error) {
      console.error('Failed to save run setting:', error);
    }
  };
  */

  const SettingRow = ({
    label,
    value,
    onPress,
    showChevron = false,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.primary }}>
        {label}
      </Text>
      {value && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.xs }}>
          <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.secondary }}>
            {value}
          </Text>
          {showChevron && <ChevronRight size={20} color={colors.text.secondary} />}
        </View>
      )}
    </Pressable>
  );

  const ToggleRow = ({
    label,
    value,
    onValueChange,
    description,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    description?: string;
  }) => (
    <View
      style={{
        paddingVertical: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.primary }}>
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border.light, true: colors.accent.green }}
          thumbColor="white"
        />
      </View>
      {description && (
        <Text
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: colors.text.secondary,
            marginTop: tokens.spacing.xs,
          }}
        >
          {description}
        </Text>
      )}
    </View>
  );

  // TODO: Implement settings in RunStore
  /*
  const RadioRow = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: tokens.spacing.md,
        paddingHorizontal: tokens.spacing.lg,
        backgroundColor: colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
      }}
    >
      <Text style={{ fontSize: tokens.typography.fontSize.md, color: colors.text.primary }}>
        {label}
      </Text>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? colors.accent.blue : colors.border.light,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && (
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: colors.accent.blue,
            }}
          />
        )}
      </View>
    </Pressable>
  );
  */

  const SectionHeader = ({ title }: { title: string }) => (
    <View
      style={{
        paddingVertical: tokens.spacing.sm,
        paddingHorizontal: tokens.spacing.lg,
        backgroundColor: colors.background.secondary,
      }}
    >
      <Text
        style={{
          fontSize: tokens.typography.fontSize.xs,
          color: colors.text.secondary,
          fontWeight: tokens.typography.fontWeight.semibold,
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingBottom: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.md }}>
          <Pressable onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={colors.text.primary} />
          </Pressable>
          <Text
            style={{
              fontSize: tokens.typography.fontSize.lg,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            Phone Recording Settings
          </Text>
        </View>
      </View>

      <ScrollView>
        {/* Audio Cues Section */}
        <SectionHeader title="AUDIO CUES" />
        <ToggleRow
          label="Start, Stop"
          value={startStopCues}
          onValueChange={(val) => {
            setStartStopCues(val);
            saveAudioSetting('startStopCues', val);
          }}
        />
        <ToggleRow
          label="Run Splits"
          value={runSplits}
          onValueChange={(val) => {
            setRunSplits(val);
            saveAudioSetting('runSplits', val);
          }}
        />
        <ToggleRow
          label="Pace Alerts"
          value={paceAlerts}
          onValueChange={(val) => {
            setPaceAlerts(val);
            saveAudioSetting('paceAlerts', val);
          }}
        />
        <SettingRow
          label="Voice"
          value={voice.charAt(0).toUpperCase() + voice.slice(1)}
          showChevron
          onPress={() => setVoiceModalVisible(true)}
        />
        <SettingRow
          label="Volume"
          value={volume.charAt(0).toUpperCase() + volume.slice(1)}
          showChevron
          onPress={() => setVolumeModalVisible(true)}
        />

        {/* Feedback Distance Section - TODO: Implement settings in RunStore
        <SectionHeader title="FEEDBACK DISTANCE" />
        <RadioRow
          label="Half Mile"
          selected={settings.feedbackDistance === "half"}
          onPress={() => {
            saveRunSetting('feedbackDistance', 'half');
            saveAudioSetting('feedbackDistance', 'half');
          }}
        />
        <RadioRow
          label="Mile"
          selected={settings.feedbackDistance === "mile"}
          onPress={() => {
            saveRunSetting('feedbackDistance', 'mile');
            saveAudioSetting('feedbackDistance', 'mile');
          }}
        />
        <View
          style={{
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.lg,
            backgroundColor: colors.background.primary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Receive feedback with your average pace during your Free Run.
          </Text>
        </View>
        */}

        {/* Start, Stop and Pause Section - TODO: Implement settings in RunStore
        <SectionHeader title="START, STOP AND PAUSE" />
        <ToggleRow
          label="Auto Pause"
          value={settings.autoPause}
          onValueChange={(val) => saveRunSetting('autoPause', val)}
          description="Automatically pause and resume your workout when you stop moving."
        />
        <ToggleRow
          label="Start on Motion"
          value={settings.startOnMotion}
          onValueChange={(val) => saveRunSetting('startOnMotion', val)}
          description="After you tap start, VoiceFit will only begin tracking your run once you start moving."
        />
        <SettingRow
          label="Countdown"
          value={settings.countdown === 0 ? 'Off' : `${settings.countdown} seconds`}
          showChevron
          onPress={() => setCountdownModalVisible(true)}
        />
        <View
          style={{
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.lg,
            backgroundColor: colors.background.primary,
          }}
        >
          <Text
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: colors.text.secondary,
            }}
          >
            Set how long the countdown is before your workout starts.
          </Text>
        </View>
        */}
      </ScrollView>

      {/* Voice Selection Modal */}
      <SelectionModal
        visible={voiceModalVisible}
        title="Select Voice"
        options={[
          { label: 'Default', value: 'default' },
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ]}
        selectedValue={voice}
        onSelect={(val) => {
          setVoice(val);
          saveAudioSetting('voice', val);
        }}
        onClose={() => setVoiceModalVisible(false)}
      />

      {/* Volume Selection Modal */}
      <SelectionModal
        visible={volumeModalVisible}
        title="Select Volume"
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
        ]}
        selectedValue={volume}
        onSelect={(val) => {
          setVolume(val);
          saveAudioSetting('volume', val);
        }}
        onClose={() => setVolumeModalVisible(false)}
      />

      {/* Countdown Selection Modal - TODO: Implement settings in RunStore
      <SelectionModal
        visible={countdownModalVisible}
        title="Select Countdown"
        options={[
          { label: 'Off', value: '0' },
          { label: '3 seconds', value: '3' },
          { label: '5 seconds', value: '5' },
          { label: '10 seconds', value: '10' },
        ]}
        selectedValue={settings.countdown.toString()}
        onSelect={(val) => saveRunSetting('countdown', parseInt(val))}
        onClose={() => setCountdownModalVisible(false)}
      />
      */}
    </View>
  );
}
