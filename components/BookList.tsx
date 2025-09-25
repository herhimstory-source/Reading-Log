import React, { useState, useRef } from 'react';
// FIX: Removed PartialBook from import as it is not an exported member of ../types and TypeScript's built-in Partial<Book> is used instead.
import type { Book } from '../types';
import { PlusIcon, UploadIcon, SparklesIcon, BookOpenIcon, DownloadIcon, LoadingSpinnerIcon, CameraIcon } from './icons';
import BarcodeScanner from './BarcodeScanner';

interface BookListProps {
  books: Book[];
  onAddBook: (title: string, author: string, publisher: string, isbn: string, coverImage?: string) => void;
  onSelectBook: (bookId: string) => void;
  onGenerateCover: (title: string, author: string) => Promise<string | null>;
  sortBy: 'createdAt' | 'title' | 'author';
  onSortChange: (sortBy: 'createdAt' | 'title' | 'author') => void;
  onExport: () => void;
  onImport: (file: File) => void;
  isImporting: boolean;
  onFetchBookInfo: (isbn: string) => Promise<Partial<Book> | null>;
}

const SortButton = ({ label, value, activeValue, onClick }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeValue === value
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);

const BookList: React.FC<BookListProps> = ({ books, onAddBook, onSelectBook, onGenerateCover, sortBy, onSortChange, onExport, onImport, isImporting, onFetchBookInfo }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [isbn, setIsbn] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isFetchingBookInfo, setIsFetchingBookInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setPublisher('');
    setIsbn('');
    setCoverPreview(null);
    setIsGenerating(false);
    setShowForm(false);
    setIsFetchingBookInfo(false);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && author.trim()) {
      onAddBook(title, author, publisher, isbn, coverPreview || undefined);
      resetForm();
    }
  };
  
  const handleFetchBookInfo = async (isbnToFetch: string) => {
    if (!isbnToFetch.trim()) {
        alert("Please enter an ISBN.");
        return;
    }
    setIsFetchingBookInfo(true);
    try {
        const bookData = await onFetchBookInfo(isbnToFetch);
        if (bookData) {
            setTitle(bookData.title || '');
            setAuthor(bookData.author || '');
            setPublisher(bookData.publisher || '');
            setIsbn(bookData.isbn || isbnToFetch);
            if (bookData.coverImage) {
                setCoverPreview(bookData.coverImage);
            }
        }
    } finally {
        setIsFetchingBookInfo(false);
    }
  };

  const handleScanSuccess = (scannedIsbn: string) => {
      setShowScanner(false);
      setIsbn(scannedIsbn);
      handleFetchBookInfo(scannedIsbn); // Automatically fetch after scan
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (event.target) {
        event.target.value = "";
    }
  };


  const handleGenerateCover = async () => {
    if (!title.trim() || !author.trim()) {
      alert("Please enter a title and author before generating a cover.");
      return;
    }
    setIsGenerating(true);
    setCoverPreview(null);
    try {
      const generatedImage = await onGenerateCover(title, author);
      if (generatedImage) {
        setCoverPreview(generatedImage);
      } else {
        throw new Error("Image generation returned null.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate cover image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      {showScanner && <BarcodeScanner onScan={handleScanSuccess} onClose={() => setShowScanner(false)} />}
      <div>
        {showForm ? (
          <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Add a New Book</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ISBN
                    <span className="text-gray-500 dark:text-gray-400"> (to auto-fill info)</span>
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      id="isbn"
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="9780743273565"
                      className="block w-full rounded-none rounded-l-md px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowScanner(true)}
                      className="relative -ml-px inline-flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Scan ISBN barcode"
                    >
                      <CameraIcon className="h-5 w-5"/>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFetchBookInfo(isbn)}
                      disabled={isFetchingBookInfo || !isbn.trim()}
                      className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-r-md text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-600 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                    >
                      {isFetchingBookInfo ? (
                        <LoadingSpinnerIcon className="w-5 h-5" />
                      ) : (
                        <span>Fetch</span>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="The Great Gatsby"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
                  <input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="F. Scott Fitzgerald"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Publisher <span className="text-gray-500">(Optional)</span></label>
                  <input
                    id="publisher"
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Penguin Random House"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Book Cover</label>
                 <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-slate-700 rounded-md flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
                    {isGenerating ? (
                         <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                             <SparklesIcon className="w-8 h-8 animate-pulse"/>
                             <p className="text-sm mt-2">Generating...</p>
                         </div>
                    ) : coverPreview ? (
                        <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                         <div className="text-center text-gray-400 dark:text-gray-500 p-2">
                             <BookOpenIcon className="w-10 h-10 mx-auto"/>
                            <p className="text-xs mt-1">Preview</p>
                         </div>
                    )}
                 </div>
              </div>
            </div>
             <div className="flex flex-col sm:flex-row gap-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCoverFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <UploadIcon className="w-5 h-5"/> Upload Cover
                </button>
                 <button type="button" onClick={handleGenerateCover} disabled={isGenerating || !title || !author} className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SparklesIcon className="w-5 h-5"/> Generate Cover
                </button>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Add Book
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Book
          </button>
        )}
      </div>
      
      {books.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
                <div className="flex items-center gap-2">
                    <SortButton label="Date Added" value="createdAt" activeValue={sortBy} onClick={onSortChange} />
                    <SortButton label="Title" value="title" activeValue={sortBy} onClick={onSortChange} />
                    <SortButton label="Author" value="author" activeValue={sortBy} onClick={onSortChange} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input 
                    type="file" 
                    ref={importFileInputRef} 
                    onChange={handleImportFileSelect} 
                    className="hidden" 
                    accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
                <button
                    onClick={() => importFileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isImporting ? (
                        <>
                            <LoadingSpinnerIcon className="w-4 h-4" />
                            Importing...
                        </>
                    ) : (
                        <>
                            <UploadIcon className="w-4 h-4" />
                            Import from Excel
                        </>
                    )}
                </button>
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Export to Excel
                </button>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => onSelectBook(book.id)}
            className="group cursor-pointer bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <img src={book.coverImage} alt={book.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600">{book.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
              {book.publisher && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">{book.publisher}</p>}
            </div>
          </div>
        ))}
      </div>
      {books.length === 0 && !showForm && (
        <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Your bookshelf is empty.</p>
            <p className="text-gray-500 dark:text-gray-400">Click "Add New Book" to get started!</p>
        </div>
      )}
    </div>
  );
};

export default BookList;