import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import apiClient from '../../services/apiClient';
import type { Product } from '../../types/entities';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', barcode: '', selling_price: '', cost_price: '' });

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/products/', { params: { search } });
      setProducts(data.results || data || []);
    } catch {
      /* ignore */
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({ name: '', barcode: '', selling_price: '', cost_price: '' });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      barcode: product.barcode || '',
      selling_price: String(product.selling_price),
      cost_price: String(product.cost_price),
    });
    setShowForm(true);
  };

  const saveProduct = async () => {
    const payload = {
      name: form.name,
      barcode: form.barcode || null,
      selling_price: parseFloat(form.selling_price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
    };

    try {
      if (editProduct) {
        await apiClient.patch(`/products/${editProduct.id}/`, payload);
      } else {
        await apiClient.post('/products/', payload);
      }
      setShowForm(false);
      fetchProducts();
    } catch {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 flex-row gap-2">
        <TextInput
          className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2"
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity className="bg-indigo-600 rounded-lg px-4 justify-center" onPress={openCreate}>
          <Text className="text-white font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white mx-4 mb-2 rounded-lg p-3 flex-row justify-between items-center"
            onPress={() => openEdit(item)}
          >
            <View className="flex-1">
              <Text className="font-medium">{item.name}</Text>
              <Text className="text-gray-400 text-xs">{item.barcode || 'No barcode'}</Text>
            </View>
            <View className="items-end">
              <Text className="font-bold">{Number(item.selling_price ?? 0).toFixed(2)}</Text>
              <Text className="text-gray-400 text-xs">Stock: {item.stock_quantity}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-gray-400 text-center py-8">No products found</Text>
        }
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white p-6">
          <Text className="text-xl font-bold mb-4">
            {editProduct ? 'Edit Product' : 'New Product'}
          </Text>

          <Text className="text-sm font-medium text-gray-700 mb-1">Name</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
            value={form.name}
            onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
            placeholder="Product name"
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Barcode</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
            value={form.barcode}
            onChangeText={(v) => setForm((f) => ({ ...f, barcode: v }))}
            placeholder="Barcode (optional)"
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Selling Price</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-3"
            value={form.selling_price}
            onChangeText={(v) => setForm((f) => ({ ...f, selling_price: v }))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <Text className="text-sm font-medium text-gray-700 mb-1">Cost Price</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
            value={form.cost_price}
            onChangeText={(v) => setForm((f) => ({ ...f, cost_price: v }))}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-lg py-3 items-center"
              onPress={() => setShowForm(false)}
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-indigo-600 rounded-lg py-3 items-center"
              onPress={saveProduct}
              disabled={!form.name}
            >
              <Text className="text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
