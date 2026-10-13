import { useUpdateAvatar } from "../../lib/queries";
import { haptics } from "../../lib/telegram";

// Должно совпадать с AVATAR_PRESETS на бэкенде (backend/src/routes/user.ts).
export const AVATAR_PRESETS = ["⚽", "🧤", "🦁", "🐺", "🦅", "🔱", "⚡", "🛡️", "👑", "🔥", "⭐", "🎯"];

interface Props {
  current: string | null;
  onClose: () => void;
}

export function AvatarPicker({ current, onClose }: Props) {
  const updateAvatar = useUpdateAvatar();

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-pitch-violet p-5 pb-8"
      >
        <p className="mb-4 text-center text-sm font-bold">Выберите аватар</p>
        <div className="grid grid-cols-4 gap-3">
          {AVATAR_PRESETS.map((icon) => (
            <button
              key={icon}
              onClick={() => {
                haptics.select();
                updateAvatar.mutate(icon, { onSuccess: onClose });
              }}
              className="flex aspect-square items-center justify-center rounded-2xl border-2 text-3xl"
              style={{
                borderColor: current === icon ? "#ffd166" : "rgba(255,255,255,0.12)",
                background: current === icon ? "rgba(255,209,102,0.15)" : "rgba(255,255,255,0.04)",
                boxShadow: current === icon ? "0 0 16px rgba(255,209,102,0.4)" : undefined,
              }}
            >
              {icon}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2 text-sm font-semibold text-white/50">
          Закрыть
        </button>
      </div>
    </div>
  );
}
