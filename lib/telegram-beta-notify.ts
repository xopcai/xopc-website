export async function notifyIosBetaSignup(email: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify({
        chat_id: chatId,
        text: `📱 有新的 iOS TestFlight 申请。\n\n邮箱：${email}`,
      }),
    });
    if (!response.ok) console.error("Telegram beta signup notification failed");
  } catch (error) {
    console.error("Telegram beta signup notification failed", error);
  }
}
