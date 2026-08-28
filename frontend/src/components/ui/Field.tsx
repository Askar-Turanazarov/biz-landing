import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const inputStyles = `w-full rounded-2xl border bg-white/[0.03] px-4 py-3.5 text-white
  placeholder:text-slate-600 transition-colors outline-none
  focus:border-accent-cyan/60 focus:bg-white/[0.05]`;

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Field({ label, error, id, className = '', ...rest }: FieldProps) {
  const fieldId = id ?? `field-${label}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`${inputStyles} ${error ? 'border-rose-400/60' : 'border-white/10'} ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, id, className = '', ...rest }: TextFieldProps) {
  const fieldId = id ?? `field-${label}`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`${inputStyles} resize-y ${error ? 'border-rose-400/60' : 'border-white/10'} ${className}`}
        {...rest}
      />
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Ловушка для ботов. Поле убрано за пределы экрана, а не скрыто через
 * display:none — часть автозаполнялок игнорирует скрытые поля, но заполняет
 * смещённые. Для скринридеров оно исключено через aria-hidden.
 */
export function HoneypotField(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
      <label htmlFor="company-website">Не заполняйте это поле</label>
      <input
        id="company-website"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        {...props}
      />
    </div>
  );
}

interface ConsentProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  error?: string;
  text: string;
}

export function ConsentCheckbox({ checked, onChange, error, text }: ConsentProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-500">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className="focus-ring mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20
                     bg-white/[0.05] accent-accent-cyan"
        />
        <span>{text}</span>
      </label>
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
