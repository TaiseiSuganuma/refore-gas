namespace Logger_ {
  export function info(message: string, data?: unknown): void {
    const payload = data !== undefined ? `${message} ${JSON.stringify(data)}` : message;
    console.log(`[INFO] ${payload}`);
  }

  export function warn(message: string, data?: unknown): void {
    const payload = data !== undefined ? `${message} ${JSON.stringify(data)}` : message;
    console.warn(`[WARN] ${payload}`);
  }

  export function error(message: string, err?: unknown): void {
    const payload = err !== undefined ? `${message} ${JSON.stringify(err)}` : message;
    console.error(`[ERROR] ${payload}`);
  }
}
