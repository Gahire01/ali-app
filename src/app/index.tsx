import { Redirect } from 'expo-router';

/**
 * Root route. Signed-in, approved members land on the member area; the
 * useProtectedRoute gate sends everyone else to the right place.
 */
export default function IndexScreen() {
  return <Redirect href="/(tabs)/home" />;
}