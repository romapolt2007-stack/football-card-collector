import WebApp from "@twa-dev/sdk";

const isInsideTelegram = typeof window !== "undefined" && Boolean(WebApp.initData);

export function initTelegram() {
  if (!isInsideTelegram) return;
  WebApp.ready();
  WebApp.expand();
  WebApp.setHeaderColor("#0b0f2b");
  WebApp.setBackgroundColor("#0b0f2b");
  // Полноэкранный режим скрывает нативный хедер Telegram (имя мини-аппы + системный
  // крестик) — доступен только в клиентах с Bot API 8.0+, поэтому вызываем через
  // необязательный рантайм-метод: в старых клиентах тихо ничего не произойдёт.
  (WebApp as unknown as { requestFullscreen?: () => void }).requestFullscreen?.();
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
