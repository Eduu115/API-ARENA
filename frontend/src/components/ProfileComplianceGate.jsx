import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProfileComplianceModal from "./ProfileComplianceModal";

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

  return (
    <ProfileComplianceModal
      open={needsCompliance}
      onSubmit={handleSubmit}
      onLogout={logout}
      submitting={submitting}
    />
  );
}
