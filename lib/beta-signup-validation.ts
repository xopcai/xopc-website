// HarmonyOS invitations use the mainland mobile number linked to a Huawei account.
export function normalizeHarmonyPhone(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 32) return null;
  const phone = value.trim().replace(/[ ()-]/g, "").replace(/^(?:\+86|0086)/, "");
  return /^1[3-9]\d{9}$/.test(phone) ? phone : null;
}
