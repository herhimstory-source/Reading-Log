import React, { useState } from 'react';
import type { Book, Sentence } from '../types';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from './icons';

interface BookDetailProps {
  book: Book;
  sentences: Sentence[];
  onBack: () => void;
  onAddSentence: (bookId: string, text: string, page: number | null) => void;
  onDeleteSentence: (sentenceId: string) => void;
  onDeleteBook: (bookId: string) => void;
  sortBy: 'createdAt' | 'page';
  onSortChange: (sortBy: 'createdAt' | 'page') => void;
}

const SortButton = ({ label, value, activeValue, onClick }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-3 py-1 text-xs rounded-full transition-colors ${
            activeValue === value
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);


const BookDetail: React.FC<BookDetailProps> = ({ book, sentences, onBack, onAddSentence, onDeleteSentence, onDeleteBook, sortBy, onSortChange }) => {
  const [sentenceText, setSentenceText] = useState('');
  const [page, setPage] = useState('');

  const handleAddSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentenceText.trim()) {
      const pageNumber = page.trim() ? parseInt(page, 10) : null;
      onAddSentence(book.id, sentenceText, pageNumber);
      setSentenceText('');
      setPage('');
    }
  };
  
  const handleDeleteBook = () => {
    if(window.confirm(`Are you sure you want to delete "${book.title}" and all its sentences?`)) {
      onDeleteBook(book.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Bookshelf
        </button>
        <button onClick={handleDeleteBook} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900/80">
          <TrashIcon className="w-4 h-4" />
          Delete Book
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-6">
        <img src={book.coverImage} alt={book.title} className="w-32 h-48 object-cover rounded-md shadow-lg flex-shrink-0" />
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{book.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">by {book.author}</p>
          {book.publisher && (
            <p className="text-md text-gray-500 dark:text-gray-400 mt-1">Published by {book.publisher}</p>
          )}
          {book.isbn && (
            <p className="text-md text-gray-500 dark:text-gray-400 mt-1">ISBN: {book.isbn}</p>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Memorable Sentences</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
            <div className="flex items-center gap-1">
                <SortButton label="Date Added" value="createdAt" activeValue={sortBy} onClick={onSortChange} />
                <SortButton label="Page #" value="page" activeValue={sortBy} onClick={onSortChange} />
            </div>
          </div>
        </div>
        <form onSubmit={handleAddSentence} className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={sentenceText}
            onChange={(e) => setSentenceText(e.target.value)}
            placeholder="Add a new sentence..."
            className="flex-grow px-3 py-2 bg-white dark:bg-slate-700 text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="number"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Page (optional)"
            className="w-full sm:w-28 px-3 py-2 bg-white dark:bg-slate-700 text-white border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2">
            <PlusIcon className="w-5 h-5"/> Add
          </button>
        </form>
        
        <div className="space-y-4">
          {sentences.length > 0 ? (
            sentences.map(sentence => (
              <div key={sentence.id} className="group flex justify-between items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <blockquote className="text-gray-700 dark:text-gray-300 italic">
                  "{sentence.text}"
                  {sentence.page && <span className="text-sm not-italic text-gray-500 dark:text-gray-400 ml-2">(p. {sentence.page})</span>}
                </blockquote>
                <button 
                    onClick={() => onDeleteSentence(sentence.id)} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                    aria-label="Delete sentence"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sentences recorded for this book yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;