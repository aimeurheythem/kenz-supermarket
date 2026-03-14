import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarLabel: 'Products',
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarLabel: 'Sales',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarLabel: 'More',
        }}
      />
    </Tabs>
  );
}
