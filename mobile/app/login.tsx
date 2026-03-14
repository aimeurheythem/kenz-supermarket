import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    clearError();
    login(email.trim(), password);
  };

  return (
    <View className="flex-1 bg-white justify-center px-8">
      <Text className="text-3xl font-bold text-center mb-2">Kenz Supermarket</Text>
      <Text className="text-gray-500 text-center mb-8">Sign in to manage your store</Text>

      {error && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
        placeholder="owner@store.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />

      <TouchableOpacity
        className={`rounded-lg py-3 items-center ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
        onPress={handleLogin}
        disabled={isLoading || !email || !password}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
