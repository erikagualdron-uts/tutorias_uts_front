import { RouteGate } from '@/features/auth/RouteGate';
import { ChangePasswordScreen } from '@/features/auth/screens/ChangePasswordScreen';

export default function ChangePasswordRoute() {
  return (
    <RouteGate expected="/change-password">
      <ChangePasswordScreen />
    </RouteGate>
  );
}
