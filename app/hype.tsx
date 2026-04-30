import { MaterialIcons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const rivalClubs = ["North End", "Skyline FC", "Thunder Club", "Harbor United"];

export default function HypeScreen() {
  const trendingRank = useMemo(() => Math.floor(Math.random() * 20) + 1, []);
  const selectedRival = useMemo(() => rivalClubs[Math.floor(Math.random() * rivalClubs.length)], []);

  const onShareHype = async () => {
    await Share.share({
      message: `Our section is trending #${trendingRank} on Crowd Meter Live. ${selectedRival}, can you match this energy? #SectionBattle`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["bottom", "left", "right"]}>
      <View className="absolute inset-0 bg-[#f8fafc]" />
      <View className="absolute -top-10 left-[-52] h-72 w-72 rounded-full bg-sky-100/70" />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-28" showsVerticalScrollIndicator={false}>
        <View className="rounded-[30px] border border-white/90 bg-white/80 p-6 shadow-sm shadow-slate-300/50">
          <Text className="text-sm uppercase tracking-[0.24rem] text-sky-700/80">Fan Momentum</Text>
          <Text className="mt-2 text-3xl font-black text-slate-900">Hype Feed</Text>
          <Text className="mt-3 text-sm leading-6 text-slate-600">
            Turn your section noise into social momentum with ranking and rivalry callouts.
          </Text>
        </View>

        <View className="mt-6 rounded-3xl border border-white/90 bg-white/80 p-5 shadow-sm shadow-slate-300/40">
          <View className="flex-row items-center">
            <MaterialIcons name="local-fire-department" size={24} color="#0284c7" />
            <Text className="ml-3 text-lg font-semibold text-slate-900">Trending Position</Text>
          </View>
          <Text className="mt-4 text-5xl font-black text-sky-600">#{trendingRank}</Text>
          <Text className="mt-2 text-slate-600">Current rivalry target: {selectedRival}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onShareHype}
          className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4"
        >
          <Text className="text-center font-extrabold text-slate-900">Share Section Battle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
