// Tiny pub/sub bus used for missions, chat triggers, store updates and live-world activity.
const listeners = new Map();

export const bus = {
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, new Set());
    listeners.get(evt).add(fn);
    return () => listeners.get(evt)?.delete(fn);
  },
  emit(evt, data) {
    listeners.get(evt)?.forEach((fn) => {
      try { fn(data); } catch (err) { console.error(`[bus] ${evt}`, err); }
    });
  },
};
