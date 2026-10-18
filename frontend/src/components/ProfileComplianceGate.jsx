import { lazy, Suspense, useState } from "react";
import { useAuth } from "../context/AuthContext";

const ProfileComplianceModal = lazy(() => import("./ProfileComplianceModal"));

export default function ProfileComplianceGate() {
  const { user, isLoading, completeProfileCompliance, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const needsCompliance =
    !isLoading && user && user.requiresProfileCompliance === true;

  async function handleSubmit(payload) {
    setSubmitting(true);
    try {
      await completeProfileCompliance(payload);
    } finally {
      setSubmitting(false);
    }
  }

  if (!needsCompliance) return null;

  return (
    <Suspense fallback={null}>
      <ProfileComplianceModal
        open
        onSubmit={handleSubmit}
        onLogout={logout}
        submitting={submitting}
      />
    </Suspense>
  );
}
