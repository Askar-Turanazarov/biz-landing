/** Фасад LLM: собрать промпт, обрезать историю, прогнать по цепочке, подстраховать mock-ответом. */
import { runChain, chainStatus } from './modelChain.js';
import { mockAnswer, mockQuizComment } from './mockLlm.js';
import { buildQuizCommentPrompt, buildSystemPrompt } from '../systemPrompt.js';
import type { ChatMessage } from '../../types.js';

/** Больше контекста ассистенту не нужно, а токены и латентность растут линейно. */
const HISTORY_LIMIT = 12;

export interface AnswerResult {
  text: string;
  model: string;
}

export async function answerQuestion(
  history: ChatMessage[],
  userText: string,
): Promise<AnswerResult> {
  const messages = [...history, { role: 'user' as const, text: userText, at: '' }]
    .slice(-HISTORY_LIMIT)
    .map((m) => ({ role: m.role, text: m.text }));

  const result = await runChain({
    system: buildSystemPrompt(),
    messages,
    maxTokens: 400,
  });

  return result ?? { text: mockAnswer(userText), model: 'mock' };
}

export async function commentQuizAnswer(question: string, answer: string): Promise<AnswerResult> {
  const result = await runChain({
    system: buildQuizCommentPrompt(),
    messages: [{ role: 'user', text: `Вопрос: ${question}\nВыбранный ответ: ${answer}` }],
    maxTokens: 120,
  });

  return result ?? { text: mockQuizComment(answer), model: 'mock' };
}

export { chainStatus };
