'use client';

import { AuthForms } from '@/features/quest/AuthForms';

export default function LoginPage() {
  return (
    <div className="dark">
      <AuthForms onBack={() => (window.location.href = '/')} />
    </div>
  );
}
