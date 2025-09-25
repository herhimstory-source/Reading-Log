import { GOOGLE_SHEET_API_URL } from '../config';
import type { Book, Sentence } from '../types';

interface FetchDataResponse {
  books: Book[];
  sentences: Sentence[];
}

// Generic function to handle POST requests to our Apps Script
const postToAction = async (action: string, data: any) => {
  const response = await fetch(GOOGLE_SHEET_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps expect text/plain for POST
    },
    body: JSON.stringify({ action, data }),
    mode: 'cors',
  });
  if (!response.ok) {
    throw new Error(`Failed to ${action}`);
  }
  return await response.json();
}

export const googleSheetService = {
  getData: async (): Promise<FetchDataResponse> => {
    const response = await fetch(GOOGLE_SHEET_API_URL, { mode: 'cors' });
     if (!response.ok) {
      throw new Error('Failed to fetch data from Google Sheet.');
    }
    return await response.json();
  },

  addBook: async (book: Book): Promise<any> => {
    return postToAction('ADD_BOOK', book);
  },

  addSentence: async (sentence: Sentence): Promise<any> => {
    return postToAction('ADD_SENTENCE', sentence);
  },

  deleteBook: async (bookId: string): Promise<any> => {
     return postToAction('DELETE_BOOK', { bookId });
  },

  deleteSentence: async (sentenceId: string): Promise<any> => {
    return postToAction('DELETE_SENTENCE', { sentenceId });
  },
};