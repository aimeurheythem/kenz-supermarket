import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import apiClient from '../../services/apiClient';

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  lowStockCount: number;
  recentSales: Array<{ id: string; total: number; sale_date: string; customer_name: string }>;
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const [summaryRes, stockRes, salesRes] = await Promise.all([
        apiClient.get('/reports/sales-summary/?period=today'),
        apiClient.get('/reports/stock-alerts/'),
        apiClient.get('/sales/?limit=5&ordering=-sale_date'),
      ]);

      setData({
        todayRevenue: summaryRes.data?.total_revenue || 0,
        todayOrders: summaryRes.data?.total_orders || 0,
        lowStockCount: stockRes.data?.count || 0,
        recentSales: salesRes.data?.results || [],
      });
    } catch {
      // silently fail — data will be empty
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        <Text className="text-2xl font-bold mb-4">Today</Text>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-500 text-sm">Revenue</Text>
            <Text className="text-2xl font-bold text-green-600">
              {data?.todayRevenue?.toFixed(2) || '0.00'}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-gray-500 text-sm">Orders</Text>
            <Text className="text-2xl font-bold">{data?.todayOrders || 0}</Text>
          </View>
        </View>

        {(data?.lowStockCount ?? 0) > 0 && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <Text className="text-amber-800 font-semibold">
              {data!.lowStockCount} products low on stock
            </Text>
          </View>
        )}

        <Text className="text-lg font-semibold mb-2">Recent Sales</Text>
        {data?.recentSales.map((sale) => (
          <View key={sale.id} className="bg-white rounded-lg p-3 mb-2 flex-row justify-between">
            <View>
              <Text className="font-medium">{sale.customer_name}</Text>
              <Text className="text-gray-400 text-xs">{sale.sale_date}</Text>
            </View>
            <Text className="font-bold">{sale.total.toFixed(2)}</Text>
          </View>
        ))}
        {(!data?.recentSales?.length) && (
          <Text className="text-gray-400 text-center py-8">No sales yet today</Text>
        )}
      </View>
    </ScrollView>
  );
}
