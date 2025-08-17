import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="auto" />
      <Tabs screenOptions={{ tabBarActiveTintColor: 'teal' }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Camera',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="photo-camera" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="saved-palettes"
          options={{
            title: 'Saved Palettes',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="palette" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
