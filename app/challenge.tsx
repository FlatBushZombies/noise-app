import { MaterialIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengeScreen() {
  const fanScore = useMemo(() => Math.floor(Math.random() * 24) + 76, []);
  const peakDb = useMemo(() => fanScore + 12, [fanScore]);
  const streakDays = useMemo(() => Math.floor(Math.random() * 6) + 3, []);

  const onShareScore = async () => {
    await Share.share({
      message: `My Fan Noise Score is ${fanScore}/100 with a peak of ${peakDb} dB on Crowd Meter Live. Beat it and tag #CrowdRoarChallenge`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["bottom", "left", "right"]}>
      <View className="absolute inset-0 bg-[#f8fafc]" />
      <View className="absolute -top-8 right-[-40] h-72 w-72 rounded-full bg-cyan-100/80" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-28" showsVerticalScrollIndicator={false}>
        <View className="rounded-[30px] border border-white/90 bg-white/80 p-6 shadow-sm shadow-slate-300/50">
          <Text className="text-sm uppercase tracking-[0.24rem] text-sky-700/80">Viral Challenge</Text>
          <Text className="mt-2 text-3xl font-black text-slate-900">Crowd Roar Score</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">
            Post your loudest matchday moment and challenge friends to top your section energy.
          </Text>
        </View>

        <View className="mt-6 rounded-3xl border border-white/90 bg-white/80 p-5 shadow-sm shadow-slate-300/40">
          <View className="flex-row items-center">
            <MaterialIcons name="emoji-events" size={24} color="#0369a1" />
            <Text className="ml-3 text-lg font-semibold text-slate-900">Today Scorecard</Text>
          </View>
          <Text className="mt-4 text-5xl font-black text-sky-600">{fanScore}</Text>
          <Text className="mt-2 text-slate-600">Peak burst: {peakDb} dB</Text>
          <Text className="mt-1 text-slate-600">Streak: {streakDays} matchdays shared</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onShareScore}
          className="mt-5 rounded-2xl border border-sky-200 bg-sky-500 px-4 py-4"
        >
          <Text className="text-center font-extrabold text-white">Share Score Challenge</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
