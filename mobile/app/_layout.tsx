import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}
