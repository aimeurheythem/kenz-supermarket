import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import apiClient from '../services/apiClient';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const { data: results } = await apiClient.get('/products/', {
        params: { barcode: data },
      });
      const products = results.results || results || [];
      if (products.length > 0) {
        Alert.alert(
          'Product Found',
          `${products[0].name}\nPrice: ${products[0].selling_price}\nStock: ${products[0].stock_quantity}`,
          [
            { text: 'Scan Again', onPress: () => setScanned(false) },
            { text: 'Close', onPress: () => router.back() },
          ],
        );
      } else {
        Alert.alert('Not Found', `No product with barcode: ${data}`, [
          { text: 'Scan Again', onPress: () => setScanned(false) },
          { text: 'Close', onPress: () => router.back() },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to look up product', [
        { text: 'Scan Again', onPress: () => setScanned(false) },
      ]);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center mb-4">Camera permission is required to scan barcodes.</Text>
        <TouchableOpacity className="bg-indigo-600 px-6 py-3 rounded-lg" onPress={requestPermission}>
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        className="flex-1"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/50">
        <Text className="text-white text-center text-lg mb-3">Point camera at a barcode</Text>
        <TouchableOpacity className="bg-white rounded-lg py-3 items-center" onPress={() => router.back()}>
          <Text className="font-semibold">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
