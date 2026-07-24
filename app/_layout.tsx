import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* headerShown: false hides the default top bar since we built our own header for the ProviderMenu */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

