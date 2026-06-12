/**
 * Primary in-app link for a notification row or push toast.
 */
export function notificationActionPath(notification) {
  if (!notification) return "/notifications";
  if (notification.type === "ACHIEVEMENT_UNLOCKED") {
    return "/perfil/achievements";
  }
  const sid = notification.metadata?.submissionId;
  if (sid != null) {
    return `/submissions/${sid}`;
  }
  return "/notifications";
}

export function notificationActionLabel(notification) {
  if (!notification) return "Open";
  if (notification.type === "ACHIEVEMENT_UNLOCKED") {
    return "See more →";
  }
  const sid = notification.metadata?.submissionId;
  if (sid != null) {
    return "View submission →";
  }
  return "Open inbox →";
}
