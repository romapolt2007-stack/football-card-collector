import { createHmac } from "node:crypto";

export interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
}

export interface ParsedInitData {
  user: TelegramUser;
  authDate: number;
  startParam?: string;
}

const MAX_INIT_DATA_AGE_SECONDS = 24 * 60 * 60;

/**
 * Проверяет подпись Telegram WebApp initData по алгоритму из документации:
 * secret_key = HMAC_SHA256("WebAppData", bot_token)
 * hash = HEX(HMAC_SHA256(data_check_string, secret_key))
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
): ParsedInitData | null {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== receivedHash) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_INIT_DATA_AGE_SECONDS) {
    return null;
  }

  const userRaw = params.get("user");
  if (!userRaw) return null;

  const user = JSON.parse(userRaw) as TelegramUser;
  const startParam = params.get("start_param") ?? undefined;

  return { user, authDate, startParam };
}
