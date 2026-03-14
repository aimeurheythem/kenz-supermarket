import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import apiClient from '../../services/apiClient';

interface Sale {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  cashier_name?: string;
  items?: { product_name: string; quantity: number; subtotal: number }[];
}

export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/sales/', { params: { ordering: '-created_at', limit: 50 } });
      setSales(data.results || data || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSales();
    setRefreshing(false);
  };

  const viewDetail = async (sale: Sale) => {
    try {
      const { data } = await apiClient.get(`/sales/${sale.id}/`);
      setSelected(data);
    } catch {
      setSelected(sale);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={sales}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white mb-2 rounded-lg p-3 flex-row justify-between items-center"
            onPress={() => viewDetail(item)}
          >
            <View>
              <Text className="font-medium">
                {new Date(item.created_at).toLocaleDateString()}{' '}
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text className="text-gray-400 text-xs">{item.payment_method || 'cash'}</Text>
            </View>
            <Text className="font-bold text-lg">{Number(item.total).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No sales found</Text>
        }
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <ScrollView className="flex-1 bg-white p-6">
          <Text className="text-xl font-bold mb-4">Sale Detail</Text>
          {selected && (
            <>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Date</Text>
                <Text>{new Date(selected.created_at).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Payment</Text>
                <Text className="capitalize">{selected.payment_method || 'cash'}</Text>
              </View>
              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500">Total</Text>
                <Text className="font-bold text-lg">{Number(selected.total).toFixed(2)}</Text>
              </View>

              {selected.items && selected.items.length > 0 && (
                <>
                  <Text className="font-semibold mb-2">Items</Text>
                  {selected.items.map((it, i) => (
                    <View key={i} className="flex-row justify-between py-1 border-b border-gray-100">
                      <Text className="flex-1">{it.product_name}</Text>
                      <Text className="w-12 text-center">x{it.quantity}</Text>
                      <Text className="w-20 text-right">{Number(it.subtotal).toFixed(2)}</Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
          <TouchableOpacity
            className="mt-6 bg-gray-200 rounded-lg py-3 items-center"
            onPress={() => setSelected(null)}
          >
            <Text className="font-semibold">Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
}
