import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

const menuItems = [
  { label: 'Customers', route: '/customers' },
  { label: 'Suppliers', route: '/suppliers' },
  { label: 'Expenses', route: '/expenses' },
  { label: 'Promotions', route: '/promotions' },
  { label: 'Reports', route: '/reports' },
  { label: 'Settings', route: '/settings' },
  { label: 'Barcode Scanner', route: '/scan' },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-lg font-bold">{user?.full_name || user?.username || 'User'}</Text>
        <Text className="text-gray-400 text-sm">{user?.email}</Text>
        <Text className="text-gray-400 text-xs capitalize mt-1">{user?.role}</Text>
      </View>

      <View className="bg-white rounded-lg overflow-hidden mb-4">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.route}
            className={`px-4 py-3 flex-row justify-between items-center ${
              index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
            onPress={() => router.push(item.route as any)}
          >
            <Text className="font-medium">{item.label}</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity className="bg-red-50 rounded-lg py-3 items-center" onPress={logout}>
        <Text className="text-red-600 font-semibold">Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
