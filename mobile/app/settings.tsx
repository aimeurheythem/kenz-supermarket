import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../services/apiClient';

interface StoreProfile {
  name: string;
  address: string;
  phone: string;
  currency: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<StoreProfile>({ name: '', address: '', phone: '', currency: 'MAD' });
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get('/settings/store-profile/')
      .then(({ data }) =>
        setProfile({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          currency: data.currency || 'MAD',
        }),
      )
      .catch(() => {});

    apiClient
      .get('/settings/notification-preferences/')
      .then(({ data }) => {
        setLowStockAlerts(data.low_stock_alerts ?? true);
        setDailySummary(data.daily_summary ?? true);
      })
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.patch('/settings/store-profile/', profile);
      Alert.alert('Saved', 'Store profile updated');
    } catch {
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPrefs = async () => {
    try {
      await apiClient.patch('/settings/notification-preferences/', {
        low_stock_alerts: lowStockAlerts,
        daily_summary: dailySummary,
      });
    } catch {
      /* silently fail */
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-indigo-600 font-semibold">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mb-4">Settings</Text>

      <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Store Profile</Text>
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Store Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
          value={profile.name}
          onChangeText={(v) => setProfile((p) => ({ ...p, name: v }))}
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Address</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
          value={profile.address}
          onChangeText={(v) => setProfile((p) => ({ ...p, address: v }))}
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Phone</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
          value={profile.phone}
          onChangeText={(v) => setProfile((p) => ({ ...p, phone: v }))}
          keyboardType="phone-pad"
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Currency</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
          value={profile.currency}
          onChangeText={(v) => setProfile((p) => ({ ...p, currency: v }))}
        />

        <TouchableOpacity
          className="bg-indigo-600 rounded-lg py-3 items-center"
          onPress={saveProfile}
          disabled={saving}
        >
          <Text className="text-white font-semibold">{saving ? 'Saving...' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Notifications</Text>
      <View className="bg-white rounded-lg p-4 mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-medium">Low Stock Alerts</Text>
          <Switch
            value={lowStockAlerts}
            onValueChange={(v) => {
              setLowStockAlerts(v);
              setTimeout(saveNotificationPrefs, 100);
            }}
            trackColor={{ true: '#6366f1' }}
          />
        </View>
        <View className="flex-row justify-between items-center">
          <Text className="font-medium">Daily Sales Summary</Text>
          <Switch
            value={dailySummary}
            onValueChange={(v) => {
              setDailySummary(v);
              setTimeout(saveNotificationPrefs, 100);
            }}
            trackColor={{ true: '#6366f1' }}
          />
        </View>
      </View>
    </ScrollView>
  );
}
