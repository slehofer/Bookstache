import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { getDailyBook } from '../services/dailyBook';

export default function DailyBookView() {
  const [book, setBook] = useState(getDailyBook);

  useEffect(() => {
    const refresh = () => {
      const current = getDailyBook();
      setBook(previous => current.date === previous.date ? previous : current);
    };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5 sm:mb-7">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-wine-700">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <time dateTime={book.date}>{book.dateLabel}</time>
        </div>
        <h1 className="text-3xl text-forest-900 sm:text-4xl">Kniha dne</h1>
      </header>

      <article aria-labelledby="daily-book-title" className="overflow-hidden rounded-2xl border border-parchment-300 bg-white shadow-sm">
        <div className="bg-forest-900 px-6 py-7 text-white sm:px-10 sm:py-10">
          <p className="mb-2 text-sm font-semibold text-parchment-200">{book.country}</p>
          <h2 id="daily-book-title" className="text-3xl leading-tight text-white sm:text-5xl">
            {book.title}
          </h2>
          <p className="mt-3 text-base font-semibold text-parchment-100 sm:text-lg">{book.author}</p>
        </div>
        <p className="border-t-4 border-parchment-400 px-6 py-6 text-base leading-relaxed text-stone-700 sm:px-10 sm:py-8 sm:text-lg">
          {book.description}
        </p>
      </article>
    </div>
  );
}
