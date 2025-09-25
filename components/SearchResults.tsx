import React from 'react';
import type { Book, Sentence } from '../types';

interface SearchResultsProps {
  searchTerm: string;
  results: Sentence[];
  books: Book[];
  onSelectBook: (bookId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ searchTerm, results, books, onSelectBook }) => {
  const getBookById = (bookId: string) => books.find(b => b.id === bookId);

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-600 dark:text-white px-1 rounded">{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const generateSearchDescription = () => {
    if (!searchTerm.trim()) return '';
    return `for sentences containing "${searchTerm}"`;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Found {results.length} result{results.length !== 1 && 's'} {generateSearchDescription()}
      </h2>
      {results.length > 0 ? (
        <div className="space-y-4">
          {results.map(sentence => {
            const book = getBookById(sentence.bookId);
            return (
              <div key={sentence.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <blockquote className="text-gray-800 dark:text-gray-200 italic mb-2">
                  "{highlightMatch(sentence.text, searchTerm)}"
                  {sentence.page && <span className="text-sm not-italic text-gray-500 dark:text-gray-400 ml-2">(p. {sentence.page})</span>}
                </blockquote>
                {book && (
                  <button onClick={() => onSelectBook(book.id)} className="text-sm text-blue-600 hover:underline">
                    from {book.title} by {book.author}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No matching sentences found.</p>
      )}
    </div>
  );
};

export default SearchResults;