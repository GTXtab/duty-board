import { useState, type FormEvent } from 'react';

interface LinkFormProps {
  readonly isLoading: boolean;
  readonly onSubmit: (link: string) => void;
}

export const LinkForm = ({ isLoading, onSubmit }: LinkFormProps) => {
  const [link, setLink] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(link.trim());
  };

  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="link">Посилання на Google Таблицю</label>
      <p className="hint">
        Доступ: «Усі, хто має посилання: переглядач». Посилання зберігається в цьому браузері.
      </p>
      <input
        id="link"
        type="url"
        required
        value={link}
        onChange={(event) => setLink(event.target.value)}
        placeholder="https://docs.google.com/spreadsheets/d/…"
      />
      <div className="actions">
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Завантажую…' : 'Підключити таблицю'}
        </button>
      </div>
    </form>
  );
};
