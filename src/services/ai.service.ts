import { prisma } from '../db.js';

// AI Usage Trackers
let aiRequestsToday = 0;
let aiRequestsThisMinute = 0;
let lastMinuteReset = Date.now();
let lastDayReset = new Date().toDateString();

export function updateAiUsageCounters() {
  const nowMs = Date.now();
  if (nowMs - lastMinuteReset > 60000) {
    aiRequestsThisMinute = 0;
    lastMinuteReset = nowMs;
  }
  const todayStr = new Date().toDateString();
  if (todayStr !== lastDayReset) {
    aiRequestsToday = 0;
    lastDayReset = todayStr;
  }
}

export function incrementAiUsage() {
  updateAiUsageCounters();
  aiRequestsThisMinute++;
  aiRequestsToday++;
}

export function getAiUsageStatsFormatted(): string {
  updateAiUsageCounters();
  return (
    `📊 **ИИ-Помощник — Статистика лимитов API**\n\n` +
    `⚡ **Лимит в минуту (RPM):** 15 запросов/мин\n` +
    `📅 **Дневной лимит (RPD):** 1 500 запросов/день\n\n` +
    `⏱️ **Запросов за текущую минуту:** \`${aiRequestsThisMinute} / 15\`\n` +
    `📊 **Запросов за текущие сутки:** \`${aiRequestsToday} / 1 500\``
  );
}

export async function generateAiResponse(prompt: string): Promise<string> {
  const cleanPrompt = prompt.replace(/^\/ai\s*/i, '').replace(/@AI\s*/i, '').trim();
  if (!cleanPrompt) return "Привет! Задай мне любой вопрос, введя `/ai ваш вопрос` или `@AI ваш вопрос`.";

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Ты — умный и вежливый ИИ-ассистент в Discord. Отвечай СТРОГО и ИСКЛЮЧИТЕЛЬНО на русском языке. Ответ должен быть информативным, подтянутым и понятным. Вопрос пользователя: ${cleanPrompt}`
                  }
                ]
              }
            ]
          })
        }
      );
      const data = (await response.json()) as any;
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (answer) return answer.trim();
    }
  } catch (e) {
    console.warn('[AI Bot] Gemini API error fallback:', e);
  }

  // Smart Built-in Russian Assistant Fallback
  const lower = cleanPrompt.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('привет') || lower.includes('здравствуй')) {
    return "Приветствую! Я твой встроенный ИИ-помощник в Custom Discord. Чем я могу помочь тебе сегодня?";
  }
  if (lower.includes('кто ты') || lower.includes('who are you')) {
    return "Я встроенный виртуальный ассистент на базе ИИ. Задавай мне любые вопросы через команду `/ai` или `@AI`!";
  }
  if (lower.includes('помощь') || lower.includes('help')) {
    return "Я умею отвечать на вопросы, генерировать код, объяснять сложные темы и переводить тексты. Просто напиши `/ai ваш вопрос`!";
  }
  return `🤖 **Ответ ИИ-ассистента на ваш вопрос:**\n\nВот что я нашёл по вашему запросу: *"${cleanPrompt}"*.\n\nЗадавайте новые вопросы в чате с помощью команды \`/ai\`!`;
}

export async function getOrCreateAiBotUser() {
  let aiBotDbUser = await prisma.user.findFirst({ where: { username: 'AI Assistant 🤖' } });
  if (!aiBotDbUser) {
    aiBotDbUser = await prisma.user.create({
      data: {
        username: 'AI Assistant 🤖',
        passwordHash: 'ai_bot_hash',
        avatarUrl: 'https://api.iconify.design/lucide:bot.svg'
      }
    });
  }
  return aiBotDbUser;
}
