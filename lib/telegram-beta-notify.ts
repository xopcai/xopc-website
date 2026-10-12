async function notifyBetaSignup(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const result = await response.json() as { ok?: boolean };
    if (response.ok && result.ok === true) return true;
    console.error("Telegram beta signup notification failed");
  } catch (error) {
    console.error("Telegram beta signup notification failed", error instanceof Error ? error.name : "unknown");
  }
  return false;
}

export async function notifyIosBetaSignup(email: string): Promise<void> {
  await notifyBetaSignup(`📱 有新的 iOS TestFlight 申请。\n\n邮箱：${email}`);
}

export async function notifyHarmonyBetaSignup(phone: string): Promise<boolean> {
  return notifyBetaSignup(`📱 有新的鸿蒙受邀测试申请。\n\n华为账号手机号：${phone}\n请将该华为账号加入 xopc 鸿蒙测试群组。`);
}
