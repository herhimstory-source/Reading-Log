import React from 'react';
import { SearchIcon } from './icons';
import type { SearchType } from '../types';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, searchType, setSearchType }) => {
  
  const searchTypes: { value: SearchType; label: string }[] = [
    { value: 'sentence', label: 'Sentences' },
    { value: 'title', label: 'Title' },
    { value: 'author', label: 'Author' },
    { value: 'publisher', label: 'Publisher' },
    { value: 'isbn', label: 'ISBN' },
  ];

  const placeholderText: Record<SearchType, string> = {
      sentence: "Search sentences...",
      title: "Search by title...",
      author: "Search by author...",
      publisher: "Search by publisher...",
      isbn: "Search by ISBN...",
  }

  return (
    <div className="relative flex w-full max-w-lg items-center bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={placeholderText[searchType]}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="block w-full bg-transparent rounded-l-full py-2 pl-10 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
      />
      <div className="h-6 border-l border-gray-300 dark:border-gray-600" aria-hidden="true"></div>
      <select
        value={searchType}
        onChange={(e) => setSearchType(e.target.value as SearchType)}
        className="block bg-transparent rounded-r-full py-2 pl-3 pr-8 text-gray-900 dark:text-gray-100 focus:outline-none appearance-none cursor-pointer"
        aria-label="Search category"
      >
        {searchTypes.map(type => (
          <option key={type.value} value={type.value}>{type.label}</option>
        ))}
      </select>
    </div>
  );
};

export default SearchBar;