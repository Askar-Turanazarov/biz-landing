import { Fragment, type ReactNode } from 'react';

/**
 * Минимальный безопасный markdown для ответов ИИ: абзацы по пустой строке, **жирный**
 * и переносы строк. Текст модели не вставляется как HTML — только React-узлы, поэтому
 * разметка из ответа не может ничего внедрить на страницу.
 */
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className={className}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={index > 0 ? 'mt-2.5' : undefined}>
          {renderLines(paragraph)}
        </p>
      ))}
    </div>
  );
}

function renderLines(paragraph: string): ReactNode[] {
  return paragraph.split('\n').map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {renderBold(line)}
    </Fragment>
  ));
}

function renderBold(line: string): ReactNode[] {
  // split с группой захвата кладёт текст между ** на нечётные позиции.
  return line.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-white">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
