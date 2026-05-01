import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
  type RecordingOptions,
} from "expo-audio";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const recordingOptions: RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 1,
  },
  ios: {
    extension: ".caf",
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export default function App() {
  const recorder = useAudioRecorder(recordingOptions);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [noiseDb, setNoiseDb] = useState(0);
  const [statusText, setStatusText] = useState("Hit START and capture the crowd.");
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recentDb, setRecentDb] = useState<number[]>(Array.from({ length: 18 }, () => 24));
  const rotation = useRef(new Animated.Value(0)).current;

  const noiseLabel = useMemo(() => {
    if (noiseDb >= 100) return "Dangerously Loud";
    if (noiseDb >= 85) return "Very Loud";
    if (noiseDb >= 70) return "Loud";
    if (noiseDb >= 55) return "Moderate";
    return "Quiet";
  }, [noiseDb]);

  const ringProgress = useMemo(() => {
    return Math.min(1, Math.max(0, noiseDb / 100));
  }, [noiseDb]);

  useEffect(() => {
    const initializePermission = async () => {
      const permission = await requestRecordingPermissionsAsync();
      const granted = permission.status === "granted" || permission.granted;
      setPermissionGranted(granted);
      if (!granted) {
        setStatusText("Microphone access is required to measure noise.");
      }
    };
    initializePermission();
  }, []);

  useEffect(() => {
    if (recorderState.isRecording && recorderState.metering != null) {
      const level = estimateDb(recorderState.metering);
      setNoiseDb(level);
      setRecentDb((prev) => [...prev.slice(1), level]);
    }
  }, [recorderState.isRecording, recorderState.metering]);

  useEffect(() => {
    const speed = Math.max(900, 2600 - noiseDb * 14);
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: speed,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    if (isMeasuring) {
      rotation.setValue(0);
      animation.start();
    } else {
      animation.stop();
      rotation.setValue(0);
    }

    return () => {
      animation.stop();
    };
  }, [isMeasuring, noiseDb, rotation]);

  useEffect(() => {
    return () => {
      if (recorderState.isRecording) {
        recorder.stop().catch(() => undefined);
      }
      setAudioModeAsync({
        allowsRecording: false,
      }).catch(() => undefined);
    };
  }, [recorder, recorderState.isRecording]);

  const estimateDb = (metering: number | null | undefined) => {
    if (metering == null || Number.isNaN(metering)) {
      return 0;
    }
    const normalized = Math.min(1, Math.max(0, (metering + 160) / 160));
    return Math.round(normalized * 80 + 20);
  };

  const startMeasuring = async () => {
    if (!permissionGranted) {
      const permission = await requestRecordingPermissionsAsync();
      const granted = permission.status === "granted" || permission.granted;
      if (!granted) {
        setStatusText("Microphone permission was denied.");
        return;
      }
      setPermissionGranted(true);
    }

    if (!cameraPermission?.granted) {
      const cameraResult = await requestCameraPermission();
      if (!cameraResult.granted) {
        setStatusText("Camera denied. You can still track sound without live backdrop.");
      }
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
        allowsBackgroundRecording: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsMeasuring(true);
      setStatusText("Live: measuring crowd intensity.");
    } catch (error) {
      console.error(error);
      setStatusText("Unable to start audio measurement.");
    }
  };

  const stopMeasuring = async () => {
    try {
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
      });
    } catch (error) {
      console.warn(error);
    } finally {
      setIsMeasuring(false);
      setStatusText("Measurement paused. Ready for the next chant.");
    }
  };

  const ringScale = 0.72 + ringProgress * 0.28;
  const ringTint =
    noiseDb >= 90 ? "rgba(239,68,68,0.9)" : noiseDb >= 75 ? "rgba(249,115,22,0.9)" : "rgba(34,197,94,0.9)";

  return (
    <View className="flex-1 bg-[#0c1929]">
      {/* Background Camera - Always visible when measuring */}
      {isMeasuring && cameraPermission?.granted ? (
        <CameraView facing="back" style={StyleSheet.absoluteFill} />
      ) : (
        <View className="absolute inset-0 bg-[#1e3a5f]" />
      )}

      {/* Translucent overlay for better readability */}
      <View className="absolute inset-0 bg-black/25" />

      {/* Decorative translucent circles */}
      <View className="absolute -top-20 left-1/2 -ml-48 h-96 w-96 rounded-full bg-cyan-500/15" />
      <View className="absolute top-32 -right-16 h-72 w-72 rounded-full bg-sky-500/[0.12]" />

      <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6 pb-24">
          <Text className="mb-2 text-xs font-bold uppercase tracking-[5px] text-sky-300/90">
            Stadium Mode
          </Text>
          <Text
            className="mb-7 text-3xl font-black text-white/95"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.3)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
            }}
          >
            Crowd Meter Live
          </Text>

          {/* Main Meter Circle - Translucent Glass Effect */}
          <View className="h-72 w-72 overflow-hidden rounded-full border border-white/30 bg-white/10">
            <View className="flex-1 items-center justify-center">
              {/* Base ring */}
              <View className="absolute h-64 w-64 rounded-full border-[12px] border-sky-300/30" />

              {/* Active ring */}
              <Animated.View
                className="absolute h-64 w-64 rounded-full border-[12px]"
                style={{
                  borderColor: ringTint,
                  transform: [{ scale: ringScale }],
                }}
              />

              {/* Inner content */}
              <View className="items-center justify-center">
                <Text
                  className="text-7xl font-black text-white"
                  style={{
                    textShadowColor: "rgba(0, 0, 0, 0.5)",
                    textShadowOffset: { width: 0, height: 3 },
                    textShadowRadius: 6,
                  }}
                >
                  {noiseDb}
                </Text>
                <Text className="text-lg font-semibold text-sky-200/90">dB</Text>
                <Text className="mt-1 text-sm font-bold uppercase tracking-widest text-sky-100/80">
                  {noiseLabel}
                </Text>
              </View>

              {/* Rotating indicator */}
              <Animated.View
                className="absolute h-60 w-60"
                style={{
                  transform: [
                    {
                      rotate: rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <View className="absolute -top-1 left-1/2 -ml-2 h-4 w-4 rounded-full bg-sky-400/90" />
              </Animated.View>
            </View>
          </View>

          {/* Bar Graph with Translucent Background */}
          <View className="mt-8 h-28 w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-2">
            <View className="flex-1 flex-row items-end justify-around py-3">
              {recentDb.map((db, idx) => {
                const barHeight = Math.max(12, (db / 100) * 80);
                const barColor =
                  db >= 90 ? "bg-red-500/90" : db >= 75 ? "bg-orange-400/90" : "bg-emerald-400/90";

                return (
                  <View
                    key={idx}
                    className={`w-3 rounded-full ${barColor}`}
                    style={{ height: barHeight }}
                  />
                );
              })}
            </View>
          </View>

          {/* Action Button with Translucent Style */}
          <TouchableOpacity
            onPress={isMeasuring ? stopMeasuring : startMeasuring}
            activeOpacity={0.85}
            className={`mt-8 flex-row items-center justify-center gap-3 rounded-full border px-10 py-4 ${
              isMeasuring
                ? "border-red-400/40 bg-red-500/30"
                : "border-sky-400/40 bg-sky-500/30"
            }`}
            style={{
              shadowColor: isMeasuring ? "#ef4444" : "#0ea5e9",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <MaterialIcons name={isMeasuring ? "stop" : "mic"} size={26} color="#ffffff" />
            <Text className="text-xl font-bold uppercase tracking-widest text-white">
              {isMeasuring ? "Stop" : "Start"}
            </Text>
          </TouchableOpacity>

          {/* Status Text with Translucent Background */}
          <View className="mt-6 rounded-xl border border-white/15 bg-white/10 px-5 py-3">
            <Text className="text-center text-sm leading-5 text-sky-100/85">{statusText}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
