import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';
import type { Book, Sentence, SearchType } from './types';
import BookList from './components/BookList';
import BookDetail from './components/BookDetail';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import BookSearchResults from './components/BookSearchResults';
import { BookOpenIcon, LoadingSpinnerIcon, CodeIcon } from './components/icons';
import { googleSheetService } from './services/googleSheetService';
import { GOOGLE_SHEET_API_URL } from './config';
import { useTheme } from './hooks/useTheme';
import ThemeToggle from './components/ThemeToggle';
import CodeViewer from './components/CodeViewer';

const App: React.FC = () => {
  useTheme(); // Initialize theme hook to set the class on the HTML element
  const [books, setBooks] = useState<Book[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('sentence');
  const [bookSortBy, setBookSortBy] = useState<'createdAt' | 'title' | 'author'>('createdAt');
  const [sentenceSortBy, setSentenceSortBy] = useState<'createdAt' | 'page'>('page');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeViewerVisible, setIsCodeViewerVisible] = useState(false);
  
  // Fetch initial data from Google Sheet
  useEffect(() => {
    const fetchData = async () => {
      if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.includes('여기에_배포된_웹_앱_URL을_붙여넣으세요') || GOOGLE_SHEET_API_URL.includes('d/1wwimPz25JIoWNHC30-amPjrtBxBIrStm_uLMSLDKXMo')) {
        setError('Configuration needed: Please update the `config.ts` file with your Google Apps Script Web App URL.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const { books, sentences } = await googleSheetService.getData();
        setBooks(books || []);
        setSentences(sentences || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please check your browser\'s console for details. Common issues: 1) Incorrect Web App URL in config.ts. 2) Incorrect Apps Script deployment settings (access must be "Anyone"). 3) Network problems.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const addBook = async (title: string, author: string, publisher: string, isbn: string, coverImage?: string) => {
    const newBook: Book = {
      id: crypto.randomUUID(),
      title,
      author,
      publisher: publisher.trim() || undefined,
      isbn: isbn.trim() || undefined,
      coverImage: coverImage || `https://picsum.photos/seed/${crypto.randomUUID()}/400/600`,
      createdAt: new Date().toISOString(),
    };
    try {
      await googleSheetService.addBook(newBook);
      setBooks(prevBooks => [...prevBooks, newBook]);
    } catch (error) {
      console.error("Failed to add book:", error);
      alert("Error: Could not save the new book to the sheet.");
    }
  };

  const deleteBook = async (bookId: string) => {
    try {
      await googleSheetService.deleteBook(bookId);
      setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
      setSentences(prevSentences => prevSentences.filter(s => s.bookId !== bookId));
      setSelectedBookId(null);
    } catch (error) {
       console.error("Failed to delete book:", error);
       alert("Error: Could not delete the book from the sheet.");
    }
  };
  
  const addSentence = async (bookId: string, text: string, page: number | null) => {
    const newSentence: Sentence = {
      id: crypto.randomUUID(),
      bookId,
      text,
      page,
      createdAt: new Date().toISOString(),
    };
    try {
       await googleSheetService.addSentence(newSentence);
       setSentences(prev => [...prev, newSentence]);
    } catch (error) {
       console.error("Failed to add sentence:", error);
       alert("Error: Could not save the new sentence to the sheet.");
    }
  };

  const deleteSentence = async (sentenceId: string) => {
    try {
      await googleSheetService.deleteSentence(sentenceId);
      setSentences(prev => prev.filter(s => s.id !== sentenceId));
    } catch (error) {
      console.error("Failed to delete sentence:", error);
      alert("Error: Could not delete the sentence from the sheet.");
    }
  };
  
  const handleSelectBook = (bookId: string) => {
      setSelectedBookId(bookId);
      setSearchTerm('');
  };

  const handleUnselectBook = () => {
      setSelectedBookId(null);
  };

  const generateCover = async (title: string, author: string): Promise<string | null> => {
    try {
      const prompt = `A professional, aesthetic book cover for a book titled "${title}" by ${author}. Minimalist, artistic design. No text on the cover.`;
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '3:4',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
      return null;
    } catch (error) {
      console.error("Error generating cover:", error);
      return null;
    }
  };

  const fetchBookDataByIsbn = async (isbn: string): Promise<Partial<Book> | null> => {
    try {
      const cleanedIsbn = isbn.replace(/[-\s]/g, '');
      if (!/^(97(8|9))?\d{9}(\d|X)$/.test(cleanedIsbn)) {
        alert("Invalid ISBN format.");
        return null;
      }

      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanedIsbn}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.totalItems === 0 || !data.items || data.items.length === 0) {
        alert(`No book found for ISBN: ${isbn}`);
        return null;
      }
      
      const volumeInfo = data.items[0].volumeInfo;
      const bookData: Partial<Book> = {
        title: volumeInfo.title,
        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author',
        publisher: volumeInfo.publisher,
        isbn: cleanedIsbn,
        coverImage: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
      };
      
      return bookData;
    } catch (error) {
      console.error("Error fetching book data:", error);
      alert("Failed to fetch book information. Please check the ISBN and your network connection.");
      return null;
    }
  };

  const handleExportToExcel = () => {
    if (books.length === 0) {
      alert("There is no data to export.");
      return;
    }

    const booksData = books.map(book => ({
      'Title': book.title,
      'Author': book.author,
      'Publisher': book.publisher || '',
      'ISBN': book.isbn || '',
      'Date Added': new Date(book.createdAt).toLocaleDateString(),
    }));

    const sentencesData = sentences.map(sentence => {
      const book = books.find(b => b.id === sentence.bookId);
      return {
        'Book Title': book?.title || 'Unknown',
        'Author': book?.author || 'Unknown',
        'Sentence': sentence.text,
        'Page': sentence.page ?? '',
        'Date Added': new Date(sentence.createdAt).toLocaleDateString(),
      }
    });

    const bookSheet = XLSX.utils.json_to_sheet(booksData);
    const sentenceSheet = XLSX.utils.json_to_sheet(sentencesData);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, bookSheet, 'Books');
    XLSX.utils.book_append_sheet(workbook, sentenceSheet, 'Sentences');

    XLSX.writeFile(workbook, 'ReadingLog_Export.xlsx');
  };

  const handleImportFromExcel = async (file: File) => {
    if (isImporting) return;
    setIsImporting(true);
    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const newBooksToAdd: Book[] = [];
            const newSentencesToAdd: Sentence[] = [];
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });

                const bookSheet = workbook.Sheets['Books'];
                if (!bookSheet) throw new Error("'Books' sheet not found in the Excel file.");
                const importedBookRows: any[] = XLSX.utils.sheet_to_json(bookSheet);

                const bookTitleAuthorToIdMap = new Map<string, string>();
                books.forEach(b => bookTitleAuthorToIdMap.set(`${b.title.toLowerCase()}|${b.author.toLowerCase()}`, b.id));

                for (const row of importedBookRows) {
                    const title = row['Title']?.trim();
                    const author = row['Author']?.trim();
                    if (!title || !author) continue;

                    const key = `${title.toLowerCase()}|${author.toLowerCase()}`;
                    if (!bookTitleAuthorToIdMap.has(key)) {
                        const newBook: Book = {
                            id: crypto.randomUUID(),
                            title,
                            author,
                            publisher: row['Publisher']?.trim() || undefined,
                            isbn: row['ISBN']?.toString().trim() || undefined,
                            coverImage: `https://picsum.photos/seed/${crypto.randomUUID()}/400/600`,
                            createdAt: new Date().toISOString(),
                        };
                        newBooksToAdd.push(newBook);
                        bookTitleAuthorToIdMap.set(key, newBook.id);
                    }
                }
                
                const sentenceSheet = workbook.Sheets['Sentences'];
                if (!sentenceSheet) throw new Error("'Sentences' sheet not found in the Excel file.");
                const importedSentenceRows: any[] = XLSX.utils.sheet_to_json(sentenceSheet);
                
                const existingSentencesSet = new Set<string>(sentences.map(s => `${s.bookId}|${s.text.toLowerCase()}`));

                for (const row of importedSentenceRows) {
                    const bookTitle = row['Book Title']?.trim();
                    const bookAuthor = row['Author']?.trim();
                    const text = row['Sentence']?.trim();
                    if (!bookTitle || !bookAuthor || !text) continue;

                    const bookKey = `${bookTitle.toLowerCase()}|${bookAuthor.toLowerCase()}`;
                    const bookId = bookTitleAuthorToIdMap.get(bookKey);

                    if (bookId) {
                        const sentenceKey = `${bookId}|${text.toLowerCase()}`;
                        if (!existingSentencesSet.has(sentenceKey)) {
                            const newSentence: Sentence = {
                                id: crypto.randomUUID(),
                                bookId,
                                text,
                                page: row['Page'] ? Number(row['Page']) : null,
                                createdAt: new Date().toISOString(),
                            };
                            newSentencesToAdd.push(newSentence);
                            existingSentencesSet.add(sentenceKey);
                        }
                    }
                }

                if (newBooksToAdd.length === 0 && newSentencesToAdd.length === 0) {
                    alert("No new data to import. The books and sentences in the file may already exist.");
                    return;
                }
                
                setBooks(prev => [...prev, ...newBooksToAdd]);
                setSentences(prev => [...prev, ...newSentencesToAdd]);

                await Promise.all([
                    ...newBooksToAdd.map(b => googleSheetService.addBook(b)),
                    ...newSentencesToAdd.map(s => googleSheetService.addSentence(s)),
                ]);

                alert(`Successfully imported ${newBooksToAdd.length} new book(s) and ${newSentencesToAdd.length} new sentence(s).`);

            } catch (err) {
                console.error("Error processing file:", err);
                alert(`Error processing file: ${err.message}`);
                setBooks(currentBooks => currentBooks.filter(b => !newBooksToAdd.some(nb => nb.id === b.id)));
                setSentences(currentSentences => currentSentences.filter(s => !newSentencesToAdd.some(ns => ns.id === s.id)));
            } finally {
                setIsImporting(false);
            }
        };
        reader.onerror = (err) => {
            console.error("File reading error:", err);
            alert("Failed to read the file.");
            setIsImporting(false);
        };
        reader.readAsArrayBuffer(file);

    } catch (err) {
        console.error("Import error:", err);
        alert(`An error occurred during import: ${err.message}`);
        setIsImporting(false);
    }
  };
  
  const selectedBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);
  
  const sentencesForSelectedBook = useMemo(() => {
    if (!selectedBookId) return [];
    const filtered = sentences.filter(s => s.bookId === selectedBookId);
    filtered.sort((a, b) => {
      switch (sentenceSortBy) {
        case 'page':
          const pageA = a.page ?? Infinity;
          const pageB = b.page ?? Infinity;
          if (pageA === pageB) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return pageA - pageB;
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return filtered;
  }, [sentences, selectedBookId, sentenceSortBy]);

  const sentenceSearchResults = useMemo(() => {
    if (searchType !== 'sentence' || !searchTerm.trim()) return [];
    return sentences.filter(s => 
      s.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sentences, searchTerm, searchType]);

  const bookSearchResults = useMemo(() => {
    if (searchType === 'sentence' || !searchTerm.trim()) return [];

    const lowercasedTerm = searchTerm.toLowerCase();
    return books.filter(book => {
      switch (searchType) {
        case 'title':
          return book.title.toLowerCase().includes(lowercasedTerm);
        case 'author':
          return book.author.toLowerCase().includes(lowercasedTerm);
        case 'publisher':
          return book.publisher?.toLowerCase().includes(lowercasedTerm) ?? false;
        case 'isbn':
          return book.isbn?.toLowerCase().includes(lowercasedTerm) ?? false;
        default:
          return false;
      }
    });
  }, [books, searchTerm, searchType]);
  
  const sortedBooks = useMemo(() => {
    const sorted = [...books];
    sorted.sort((a, b) => {
      switch (bookSortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return sorted;
  }, [books, bookSortBy]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <LoadingSpinnerIcon className="w-12 h-12 text-blue-600" />
          <p className="mt-4 text-lg">Loading your reading log...</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg">
          <h3 className="text-xl font-bold text-red-800 dark:text-red-300">An Error Occurred</h3>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
        </div>
      );
    }
    
    if (searchTerm.trim()) {
      if (searchType === 'sentence') {
        return <SearchResults 
                  searchTerm={searchTerm}
                  results={sentenceSearchResults} 
                  books={books} 
                  onSelectBook={handleSelectBook} 
                />;
      } else {
        return <BookSearchResults
                  searchTerm={searchTerm}
                  searchType={searchType}
                  results={bookSearchResults}
                  onSelectBook={handleSelectBook}
                />
      }
    }

    if (selectedBook) {
      return (
        <BookDetail 
          book={selectedBook} 
          sentences={sentencesForSelectedBook}
          onBack={handleUnselectBook}
          onAddSentence={addSentence}
          onDeleteSentence={deleteSentence}
          onDeleteBook={deleteBook}
          sortBy={sentenceSortBy}
          onSortChange={setSentenceSortBy}
        />
      );
    }
    return <BookList 
             books={sortedBooks} 
             onAddBook={addBook} 
             onSelectBook={handleSelectBook} 
             onGenerateCover={generateCover} 
             sortBy={bookSortBy}
             onSortChange={setBookSortBy}
             onExport={handleExportToExcel}
             onImport={handleImportFromExcel}
             isImporting={isImporting}
             onFetchBookInfo={fetchBookDataByIsbn}
           />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <div className={`transition-all duration-300 ${isCodeViewerVisible ? 'lg:pr-[40%]' : 'pr-0'}`}>
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg sticky top-0 z-10 shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setSelectedBookId(null);
                setSearchTerm('');
              }}
            >
              <BookOpenIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Reading Log</h1>
            </div>
            <div className="flex items-center gap-2">
              <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                searchType={searchType} 
                setSearchType={setSearchType} 
              />
              <ThemeToggle />
              <button
                onClick={() => setIsCodeViewerVisible(v => !v)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-colors"
                aria-label="Show backend code"
              >
                  <CodeIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
        <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>Created with passion for reading.</p>
        </footer>
      </div>
      <CodeViewer isOpen={isCodeViewerVisible} onClose={() => setIsCodeViewerVisible(false)} />
    </div>
  );
};

export default App;