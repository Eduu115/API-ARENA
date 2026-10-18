import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSocialPrivacy, updateSocialPrivacy } from "../lib/socialApi";

export default function SocialPrivacyControls() {
  const { t } = useTranslation("profile");
  const [visibility, setVisibility] = useState("FRIENDS");
  const [alerts, setAlerts] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSocialPrivacy()
      .then((row) => {
        if (cancelled || !row) return;
        setVisibility(row.activityVisibility === "PRIVATE" ? "PRIVATE" : "FRIENDS");
        setAlerts(row.friendPostNotifications !== false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(nextVisibility, nextAlerts) {
    setVisibility(nextVisibility);
    setAlerts(nextAlerts);
    setStatus(null);
    try {
      await updateSocialPrivacy({
        activityVisibility: nextVisibility,
        friendPostNotifications: nextAlerts,
      });
      setStatus(t("socialPrivacySaved"));
    } catch {
      setStatus(t("socialPrivacyError"));
    }
  }

  return (
    <div className="profile-social-privacy">
      <p>{t("socialVisibilityHelp")}</p>
      <label>
        <input
          type="radio"
          name="social-visibility"
          checked={visibility === "FRIENDS"}
          onChange={() => save("FRIENDS", alerts)}
        />
        {t("socialVisibilityFriends")}
      </label>
      <label>
        <input
          type="radio"
          name="social-visibility"
          checked={visibility === "PRIVATE"}
          onChange={() => save("PRIVATE", alerts)}
        />
        {t("socialVisibilityPrivate")}
      </label>
      <label>
        <input
          type="checkbox"
          checked={alerts}
          onChange={(e) => save(visibility, e.target.checked)}
        />
        {t("socialNotifyFriends")}
      </label>
      {status && <p>{status}</p>}
    </div>
  );
}
