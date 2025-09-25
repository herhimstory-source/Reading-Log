import React from 'react';
import type { Book, SearchType } from '../types';

interface BookSearchResultsProps {
  searchTerm: string;
  searchType: SearchType;
  results: Book[];
  onSelectBook: (bookId: string) => void;
}

const BookSearchResults: React.FC<BookSearchResultsProps> = ({ searchTerm, searchType, results, onSelectBook }) => {
  
  const highlightMatch = (text: string | undefined, highlight: string) => {
    if (!highlight.trim() || !text) {
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
    return `for ${searchType} "${searchTerm}"`;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
        Found {results.length} book{results.length !== 1 && 's'} {generateSearchDescription()}
      </h2>
      
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((book) => (
            <div
              key={book.id}
              onClick={() => onSelectBook(book.id)}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <img src={book.coverImage} alt={book.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600">
                  {searchType === 'title' ? highlightMatch(book.title, searchTerm) : book.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  by {searchType === 'author' ? highlightMatch(book.author, searchTerm) : book.author}
                </p>
                {book.publisher && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                    {searchType === 'publisher' ? highlightMatch(book.publisher, searchTerm) : book.publisher}
                  </p>
                )}
                {book.isbn && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
                    ISBN: {searchType === 'isbn' ? highlightMatch(book.isbn, searchTerm) : book.isbn}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No books found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default BookSearchResults;