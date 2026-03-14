import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../services/apiClient';

interface Subscription {
  plan_name: string;
  status: string;
  trial_end_date: string | null;
  grace_period_end: string | null;
  limits: { max_products: number; max_cashiers: number };
  usage: { products: number; cashiers: number };
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/billing/subscription/')
      .then(({ data }) => setSub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPortal = async () => {
    try {
      const { data } = await apiClient.post('/billing/portal-session/', {});
      if (data.url) Linking.openURL(data.url);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-indigo-600 font-semibold">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mb-4">Subscription</Text>

      {sub && (
        <>
          <View className="bg-white rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold capitalize">{sub.plan_name} Plan</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View
                className={`rounded-full px-2 py-0.5 ${
                  sub.status === 'active' ? 'bg-green-100' : sub.status === 'trial' ? 'bg-yellow-100' : 'bg-red-100'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    sub.status === 'active'
                      ? 'text-green-700'
                      : sub.status === 'trial'
                        ? 'text-yellow-700'
                        : 'text-red-700'
                  }`}
                >
                  {sub.status}
                </Text>
              </View>
            </View>

            {sub.trial_end_date && (
              <Text className="text-sm text-gray-500 mt-2">
                Trial ends: {new Date(sub.trial_end_date).toLocaleDateString()}
              </Text>
            )}
          </View>

          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Usage</Text>
          <View className="bg-white rounded-lg p-4 mb-4">
            <UsageRow label="Products" current={sub.usage.products} max={sub.limits.max_products} />
            <View className="h-3" />
            <UsageRow label="Cashiers" current={sub.usage.cashiers} max={sub.limits.max_cashiers} />
          </View>

          <TouchableOpacity className="bg-indigo-600 rounded-lg py-3 items-center" onPress={openPortal}>
            <Text className="text-white font-semibold">Manage Subscription</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function UsageRow({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-600">{label}</Text>
        <Text className="text-sm font-medium">
          {current} / {max}
        </Text>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}
