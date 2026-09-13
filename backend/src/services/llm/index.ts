/** Фасад LLM: собрать промпт, обрезать историю, прогнать по цепочке, подстраховать mock-ответом. */
import { runChain, chainStatus } from './modelChain.js';
import { mockAnswer, mockLeadSummary, mockQuizComment, mockQuizResult } from './mockLlm.js';
import {
  buildLeadSummaryPrompt,
  buildQuizCommentPrompt,
  buildQuizResultPrompt,
  buildSystemPrompt,
} from '../systemPrompt.js';
import { answersText, matchFacts } from '../qualification.js';
import type { ChatMessage, LeadTemperature, QuizAnswer, QuizMatch } from '../../types.js';

/** Больше контекста ассистенту не нужно, а токены и латентность растут линейно. */
const HISTORY_LIMIT = 12;

/** Для выжимки менеджеру хватает конца диалога: бюджет и срок обычно звучат ближе к заявке. */
const SUMMARY_DIALOG_LIMIT = 20;

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

export async function commentQuizAnswer(
  question: string,
  answer: string,
  previous: QuizAnswer[] = [],
): Promise<AnswerResult> {
  // Без прошлых ответов модель не знает, что бюджет называет человек, которому нужен магазин.
  const context = previous.length ? `Раньше посетитель ответил:\n${answersText(previous)}\n\n` : '';
  const result = await runChain({
    system: buildQuizCommentPrompt(),
    messages: [{ role: 'user', text: `${context}Текущий вопрос: ${question}\nВыбранный ответ: ${answer}` }],
    maxTokens: 120,
  });

  return result ?? { text: mockQuizComment(answer), model: 'mock' };
}

/** Пояснение к итогу квиза. Расчёт уже готов — модель только формулирует. */
export async function quizResultText(match: QuizMatch, answers: QuizAnswer[]): Promise<AnswerResult> {
  const result = await runChain({
    system: buildQuizResultPrompt(),
    messages: [
      { role: 'user', text: `ОТВЕТЫ ПОСЕТИТЕЛЯ\n${answersText(answers)}\n\nРАСЧЁТ\n${matchFacts(match)}` },
    ],
    maxTokens: 250,
  });

  return result ?? { text: mockQuizResult(match), model: 'mock' };
}

export interface LeadSummaryInput {
  match: QuizMatch | null;
  answers: QuizAnswer[];
  comment: string;
  dialog: ChatMessage[];
}

export interface LeadSummaryResult {
  temperature: LeadTemperature | null;
  summary: string;
  model: string;
}

/** Выжимка заявки для менеджера. null — выжимать нечего: ни квиза, ни комментария, ни диалога. */
export async function leadSummary(input: LeadSummaryInput): Promise<LeadSummaryResult | null> {
  const parts: string[] = [];
  if (input.answers.length) parts.push(`ОТВЕТЫ КВИЗА\n${answersText(input.answers)}`);
  if (input.match) parts.push(`РАСЧЁТ ПО ПРАЙСУ\n${matchFacts(input.match)}`);
  if (input.comment) parts.push(`КОММЕНТАРИЙ КЛИЕНТА\n${input.comment}`);

  const dialog = input.dialog.slice(-SUMMARY_DIALOG_LIMIT);
  if (dialog.length) {
    const lines = dialog.map((m) => `${m.role === 'user' ? 'Клиент' : 'Помощник'}: ${m.text.slice(0, 500)}`);
    parts.push(`ПЕРЕПИСКА С ИИ-ПОМОЩНИКОМ\n${lines.join('\n')}`);
  }
  if (!parts.length) return null;

  const result = await runChain({
    system: buildLeadSummaryPrompt(),
    messages: [{ role: 'user', text: parts.join('\n\n') }],
    maxTokens: 300,
  });

  if (!result) {
    return input.match
      ? { temperature: input.match.temperature, summary: mockLeadSummary(input.match), model: 'mock' }
      : null;
  }
  return { ...parseLeadSummary(result.text), model: result.model };
}

/** Модель отвечает строками «Метка: …» и «Резюме: …»; разбираем с запасом на markdown. */
function parseLeadSummary(text: string): { temperature: LeadTemperature | null; summary: string } {
  const plain = text.replace(/\*+/g, '');
  const label = plain.match(/Метка[:\s]*(горяч|т[её]пл|холодн)/iu)?.[1]?.toLowerCase();
  const temperature: LeadTemperature | null = !label
    ? null
    : label.startsWith('горяч')
      ? 'hot'
      : label.startsWith('холодн')
        ? 'cold'
        : 'warm';
  const summary = (plain.match(/Резюме[:\s]*([\s\S]+)/iu)?.[1] ?? plain.replace(/^.*Метка.*$/imu, ''))
    .trim()
    .slice(0, 800);
  return { temperature, summary };
}

export { chainStatus };
