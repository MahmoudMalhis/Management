module.exports = (v) => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return v ?? [];
};
