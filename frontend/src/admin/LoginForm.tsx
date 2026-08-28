import { useState } from 'react';
import { adminApi } from './adminApi';
import { Button } from '../components/ui/Button';
import { Field } from '../components/ui/Field';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminApi.login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={handleSubmit} className="glass-strong w-full max-w-sm p-8">
        <h1 className="font-display text-xl font-extrabold text-white">Панель управления</h1>
        <p className="mt-1.5 text-sm text-slate-500">Доступ только для сотрудников студии.</p>

        <div className="mt-7 flex flex-col gap-4">
          <Field
            label="Пароль"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" disabled={busy || !password} className="w-full">
            {busy ? 'Проверяем…' : 'Войти'}
          </Button>
        </div>
      </form>
    </div>
  );
}
