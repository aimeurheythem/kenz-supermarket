import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../services/apiClient';

interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  average_order: number;
}

interface TopProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    apiClient
      .get('/reports/sales-summary/', { params: { period } })
      .then(({ data }) => setSummary(data))
      .catch(() => {});

    apiClient
      .get('/reports/top-products/', { params: { period, limit: 10 } })
      .then(({ data }) => setTopProducts(data.results || data || []))
      .catch(() => {});
  }, [period]);

  const maxRevenue = topProducts.length
    ? Math.max(...topProducts.map((p) => p.total_revenue))
    : 1;

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <TouchableOpacity onPress={() => router.back()} className="mb-4">
        <Text className="text-indigo-600 font-semibold">← Back</Text>
      </TouchableOpacity>

      <Text className="text-xl font-bold mb-4">Reports</Text>

      <View className="flex-row gap-2 mb-4">
        {(['today', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            className={`flex-1 py-2 rounded-lg items-center ${
              period === p ? 'bg-indigo-600' : 'bg-white border border-gray-200'
            }`}
            onPress={() => setPeriod(p)}
          >
            <Text
              className={`font-semibold capitalize ${period === p ? 'text-white' : 'text-gray-700'}`}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {summary && (
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-lg p-3 items-center">
            <Text className="text-gray-400 text-xs">Revenue</Text>
            <Text className="text-lg font-bold">{Number(summary.total_revenue).toFixed(2)}</Text>
          </View>
          <View className="flex-1 bg-white rounded-lg p-3 items-center">
            <Text className="text-gray-400 text-xs">Orders</Text>
            <Text className="text-lg font-bold">{summary.total_orders}</Text>
          </View>
          <View className="flex-1 bg-white rounded-lg p-3 items-center">
            <Text className="text-gray-400 text-xs">Avg Order</Text>
            <Text className="text-lg font-bold">{Number(summary.average_order).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Top Products</Text>
      <View className="bg-white rounded-lg p-4">
        {topProducts.length === 0 ? (
          <Text className="text-gray-400 text-center py-4">No data</Text>
        ) : (
          topProducts.map((product, i) => (
            <View key={i} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="font-medium text-sm flex-1" numberOfLines={1}>
                  {i + 1}. {product.product_name}
                </Text>
                <Text className="text-sm font-semibold">
                  {Number(product.total_revenue).toFixed(2)}
                </Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${(product.total_revenue / maxRevenue) * 100}%`,
                  }}
                />
              </View>
              <Text className="text-gray-400 text-xs mt-0.5">{product.total_quantity} units</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
