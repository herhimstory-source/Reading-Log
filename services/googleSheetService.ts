import type { Book, Sentence } from '../types';

interface FetchDataResponse {
  books: Book[];
  sentences: Sentence[];
}

// Generic function to handle POST requests to our Apps Script
const postToAction = async (sheetUrl: string, action: string, data: any) => {
  const response = await fetch(sheetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Apps Script web apps expect text/plain for POST
    },
    body: JSON.stringify({ action, data }),
    mode: 'cors',
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to ${action}. Response:`, errorText);
    throw new Error(`Failed to ${action}. Status: ${response.status}`);
  }
  return await response.json();
}

export const googleSheetService = {
  getData: async (sheetUrl: string): Promise<FetchDataResponse> => {
    const response = await fetch(sheetUrl, { mode: 'cors' });
     if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch data. Response:', errorText);
      throw new Error(`Failed to fetch data from Google Sheet. Status: ${response.status}`);
    }
    return await response.json();
  },

  addBook: async (sheetUrl: string, book: Book): Promise<any> => {
    return postToAction(sheetUrl, 'ADD_BOOK', book);
  },

  addSentence: async (sheetUrl: string, sentence: Sentence): Promise<any> => {
    return postToAction(sheetUrl, 'ADD_SENTENCE', sentence);
  },

  deleteBook: async (sheetUrl: string, bookId: string): Promise<any> => {
     return postToAction(sheetUrl, 'DELETE_BOOK', { bookId });
  },

  deleteSentence: async (sheetUrl: string, sentenceId: string): Promise<any> => {
    return postToAction(sheetUrl, 'DELETE_SENTENCE', { sentenceId });
  },
};