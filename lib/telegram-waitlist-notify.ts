/**
 * 新邮箱进入等待列表时向 Telegram 推送通知（含邮箱；不含人数、时间等统计信息）。
 * 需配置环境变量：TELEGRAM_BOT_TOKEN、TELEGRAM_CHAT_ID
 */
export async function notifyWaitlistSignup(email: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.warn("Telegram waitlist notify skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🎉 有新的邮箱申请加入 XOPC 等待列表。\n\n邮箱：${email}`,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };
    if (!data.ok) {
      console.error("Telegram send failed:", data);
    }
  } catch (e) {
    console.error("Telegram send error:", e);
  }
}
