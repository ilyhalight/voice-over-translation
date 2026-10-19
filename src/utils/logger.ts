const LOG_COLORS = {
  info: "#8bb4f5",
  error: "#f28b82",
  warn: "#f6c177",
  log: "#a6adc8",
};

const logImpl = (
  type: "log" | "info" | "warn" | "error",
  ...text: unknown[]
) => {
  console[type](
    "%cVOT",
    `background: ${LOG_COLORS[type]}; color: #000; padding: 0 4px;border-radius: 4px;font-weight: bold;`,
    ...text,
  );
};

export default {
  log: (...text: unknown[]) => logImpl("log", ...text),
  info: (...text: unknown[]) => logImpl("info", ...text),
  warn: (...text: unknown[]) => logImpl("warn", ...text),
  error: (...text: unknown[]) => logImpl("error", ...text),
};
