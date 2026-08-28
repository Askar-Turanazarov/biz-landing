import { motion } from 'framer-motion';
import { quizSteps } from '../site.config';
import { useAssistantStore } from './useAssistantStore';
import { MessageList } from './MessageList';
import { ArrowRight } from '../components/ui/Icons';

/**
 * Квиз: варианты ответов — обычные кнопки, поэтому шаг переключается мгновенно.
 * Реплика ИИ по предыдущему ответу дописывается в ленту асинхронно и
 * не задерживает переход к следующему вопросу.
 */
export function QuizView() {
  const { quizIndex, quizAnswers, messages, answerQuiz, goBackQuiz } = useAssistantStore();
  const step = quizSteps[quizIndex];
  const progress = (quizIndex / quizSteps.length) * 100;

  if (!step) return null;

  const previousAnswer = quizAnswers.find((a) => a.stepId === step.id)?.answer;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Полоса прогресса: видно, сколько осталось — это заметно снижает отвал. */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Вопрос {quizIndex + 1} из {quizSteps.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full rounded-full bg-accent-line"
            animate={{ width: `${Math.max(progress, 4)}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <MessageList messages={messages} isTyping={false} className="min-h-0 flex-1" />

      <div className="border-t border-white/[0.07] p-5">
        <motion.div key={step.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-display text-base font-bold text-white">{step.question}</p>
          {step.hint && <p className="mt-1 text-xs text-slate-500">{step.hint}</p>}

          <div className="mt-4 flex flex-col gap-2">
            {step.options.map((option) => (
              <button
                key={option}
                onClick={() => answerQuiz(option)}
                className={`focus-ring group flex items-center justify-between gap-3 rounded-2xl
                            border px-4 py-3 text-left text-sm transition-colors
                            ${
                              previousAnswer === option
                                ? 'border-accent-cyan/50 bg-accent-soft text-white'
                                : 'border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.07]'
                            }`}
              >
                {option}
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-slate-600 transition-transform
                             duration-200 group-hover:translate-x-0.5 group-hover:text-accent-cyan"
                />
              </button>
            ))}
          </div>

          <button
            onClick={goBackQuiz}
            className="focus-ring mt-4 rounded text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            ← Назад
          </button>
        </motion.div>
      </div>
    </div>
  );
}
