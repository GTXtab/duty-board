import { useState, type FormEvent } from 'react';

interface ImportPanelProps {
  readonly onImport: (text: string) => void;
  readonly onSample: () => void;
}

export const ImportPanel = ({ onImport, onSample }: ImportPanelProps) => {
  const [text, setText] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onImport(text);
  };

  return (
    <form className="card" onSubmit={submit}>
      <label htmlFor="sheet">Або встав таблицю вручну</label>
      <p className="hint">
        У Google Таблицях або Excel виділи все (Ctrl+A), скопіюй (Ctrl+C) і встав сюди (Ctrl+V).
      </p>
      <textarea
        id="sheet"
        rows={10}
        spellCheck={false}
        wrap="off"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={'Дата\tІм’я 1\tІм’я 2\n27.11.2026\tЧ\tХ'}
      />
      <div className="actions">
        <button type="submit">Показати графік</button>
        <button type="button" className="secondary" onClick={onSample}>
          Переглянути приклад
        </button>
      </div>
      <details>
        <summary>Яка таблиця підходить</summary>
        <ul>
          <li>Колонка «Дата», праворуч від неї імена. Дати у форматі ДД.ММ.РРРР.</li>
          <li>Щоденне чергування: дати поспіль.</li>
          <li>Генеральне прибирання (необов’язково): окрема таблиця через порожню колонку, дати з проміжками.</li>
          <li>Позначки: порожньо — вдома, Х — поїхав, Ч — чергує, ✓ або ввімкнений чекбокс — відчергував.</li>
        </ul>
      </details>
    </form>
  );
};
