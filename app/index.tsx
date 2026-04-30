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
import { Animated, Easing, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const recordingOptions: RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".m4a",
    sampleRate: 44100,
    bitRate: 128000,
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
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top", "left", "right"]}>
      {isMeasuring && cameraPermission?.granted ? (
        <CameraView facing="back" className="absolute inset-0" />
      ) : (
        <View className="absolute inset-0 bg-[#f8fafc]" />
      )}
      <View className="absolute inset-0 bg-white/55" />
      <View className="absolute -top-20 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-100/80" />
      <View className="absolute top-32 right-[-64] h-72 w-72 rounded-full bg-sky-100/70" />

      <View className="flex-1 items-center justify-center px-6 pb-24">
        <Text className="mb-2 text-xs font-bold uppercase tracking-[0.35rem] text-sky-700">Stadium Mode</Text>
        <Text className="mb-7 text-3xl font-black text-slate-900">Crowd Meter Live</Text>

        <View className="h-72 w-72 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-lg shadow-slate-300/60">
          <View className="absolute h-64 w-64 rounded-full border-[12px] border-sky-200" />
          <View
            className="absolute h-64 w-64 rounded-full border-[12px]"
            style={{
              borderColor: ringTint,
              transform: [{ scale: ringScale }],
            }}
          />
          <Animated.View
            className="absolute h-64 w-64 items-center"
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
            <View className="h-4 w-4 rounded-full bg-sky-500" />
          </Animated.View>

          <Text className="text-6xl font-black text-slate-900">{noiseDb}</Text>
          <Text className="mt-1 text-sm font-semibold uppercase tracking-[0.2rem] text-slate-500">dB</Text>
          <Text className="mt-2 text-sm font-semibold text-sky-700">{noiseLabel}</Text>
        </View>

        <View className="mt-6 h-16 w-full max-w-[320px] flex-row items-end justify-between rounded-2xl border border-white/90 bg-white/70 px-3 py-2">
          {recentDb.map((value, idx) => (
            <View
              key={`${idx}-${value}`}
              className="w-2 rounded-full bg-sky-500/90"
              style={{ height: Math.max(6, Math.round((value / 100) * 48)) }}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={isMeasuring ? stopMeasuring : startMeasuring}
          className="mt-8 min-w-[230px] rounded-full border border-sky-200 bg-sky-500 px-8 py-4 shadow-md shadow-sky-200"
        >
          <View className="flex-row items-center justify-center">
            <MaterialIcons name={isMeasuring ? "stop-circle" : "play-circle"} size={22} color="#ffffff" />
            <Text className="ml-2 text-base font-extrabold text-white">
              {isMeasuring ? "Stop" : "Start"}
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="mt-4 text-center text-sm text-slate-500">{statusText}</Text>
      </View>
    </SafeAreaView>
  );
}
