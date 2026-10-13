export interface PackTheme {
  background: string;
  borderColor: string;
}

export const PACK_THEME: Record<string, PackTheme> = {
  starter: {
    background: "linear-gradient(160deg, #2f3a55, #171d30)",
    borderColor: "#5b6b96",
  },
  bronze: {
    background: "linear-gradient(160deg, #a96a35, #4a2a10)",
    borderColor: "#cd7f32",
  },
  silver: {
    background: "linear-gradient(160deg, #d7dade, #71767f)",
    borderColor: "#e6e8ec",
  },
  gold: {
    background: "linear-gradient(160deg, #ffe9a8, #8a5a06)",
    borderColor: "#ffd166",
  },
  legend: {
    background: "linear-gradient(160deg, #cfa3ff, #4a1393)",
    borderColor: "#b24bf3",
  },
  icon: {
    background: "linear-gradient(160deg, #ff8fa3, #6b0018)",
    borderColor: "#ff3b5c",
  },
};
