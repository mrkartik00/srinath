// Minimal pub/sub so axios (a plain module, not a component) can tell
// AuthContext to clear its in-memory user state when a request comes back
// 401 — without this, AsyncStorage gets wiped but the app keeps rendering
// as if still logged in, and every subsequent request fails with
// "no token provided" until the app is fully restarted.
const listeners = new Set();

export const onUnauthorized = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitUnauthorized = () => {
  listeners.forEach((listener) => listener());
};
