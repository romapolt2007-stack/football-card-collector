import WebApp from "@twa-dev/sdk";

const isInsideTelegram = typeof window !== "undefined" && Boolean(WebApp.initData);

export function initTelegram() {
  if (!isInsideTelegram) return;
  WebApp.ready();
  WebApp.expand();
  WebApp.setHeaderColor("#070f12");
  WebApp.setBackgroundColor("#070f12");
}

export function getInitData(): string {
  return isInsideTelegram ? WebApp.initData : "";
}

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationStyle = "error" | "success" | "warning";

export const haptics = {
  impact: (style: HapticStyle = "light") => {
    if (isInsideTelegram) WebApp.HapticFeedback.impactOccurred(style);
  },
  notify: (style: NotificationStyle) => {
    if (isInsideTelegram) WebApp.HapticFeedback.notificationOccurred(style);
  },
  select: () => {
    if (isInsideTelegram) WebApp.HapticFeedback.selectionChanged();
  },
};

export { isInsideTelegram };
