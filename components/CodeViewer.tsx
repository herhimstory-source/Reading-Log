import React, { useState } from 'react';
import { XIcon } from './icons';

interface CodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const appsScriptCode = `
/**
 * Reading Log - Google Apps Script Backend
 *
 * This script acts as a web app API using a Google Sheet as a database
 * to manage book and sentence information.
 */

// ==================================================================
// CONFIGURATION - Specify your sheet names here.
// ==================================================================
const BOOKS_SHEET_NAME = 'Books';
const SENTENCES_SHEET_NAME = 'Sentences';

// ==================================================================
// HTTP REQUEST HANDLERS
// ==================================================================

/**
 * Handles GET requests to the web app.
 * Fetches all book and sentence data from the spreadsheet.
 * @param {GoogleAppsScript.Events.DoGet} e The event parameter.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response with all data.
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const booksSheet = ss.getSheetByName(BOOKS_SHEET_NAME);
    const sentencesSheet = ss.getSheetByName(SENTENCES_SHEET_NAME);

    if (!booksSheet || !sentencesSheet) {
      throw new Error('Required sheets (Books or Sentences) not found.');
    }

    const books = sheetDataToObjects(booksSheet.getDataRange().getValues());
    const sentences = sheetDataToObjects(sentencesSheet.getDataRange().getValues());
    
    const data = {
      books,
      sentences,
    };
    
    return createJsonResponse(data);
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch data');
  }
}

/**
 * Handles POST requests to the web app.
 * Used for adding or deleting data based on the 'action' parameter.
 * @param {GoogleAppsScript.Events.DoPost} e The event parameter.
 * @return {GoogleAppsScript.Content.TextOutput} JSON response indicating success or failure.
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const { action, data } = request;

    if (!action) {
      throw new Error("Action not specified in the request.");
    }

    let result;
    switch(action.toUpperCase()) {
      case 'ADD_BOOK':
        result = addBook(data);
        break;
      case 'ADD_SENTENCE':
        result = addSentence(data);
        break;
      case 'DELETE_BOOK':
        result = deleteBook(data.bookId);
        break;
      case 'DELETE_SENTENCE':
        result = deleteSentence(data.sentenceId);
        break;
      default:
        throw new Error(\`Unknown action: \${action}\`);
    }

    return createJsonResponse(result);
  } catch (error) {
    return createErrorResponse(error, \`Failed to process POST request\`);
  }
}

// ==================================================================
// DATA MANIPULATION FUNCTIONS
// ==================================================================

/**
 * Adds a new book to the 'Books' sheet.
 * @param {object} bookData - The book object to add.
 * @returns {object} A success message.
 */
function addBook(bookData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BOOKS_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => bookData[header] || null);
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Book added successfully', data: bookData };
}

/**
 * Adds a new sentence to the 'Sentences' sheet.
 * @param {object} sentenceData - The sentence object to add.
 * @returns {object} A success message.
 */
function addSentence(sentenceData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SENTENCES_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => sentenceData[header] !== undefined ? sentenceData[header] : null);
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Sentence added successfully', data: sentenceData };
}

/**
 * Deletes a book and all its associated sentences.
 * @param {string} bookId - The ID of the book to delete.
 * @returns {object} A success message.
 */
function deleteBook(bookId) {
  if (!bookId) throw new Error("bookId is required for deletion.");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const booksSheet = ss.getSheetByName(BOOKS_SHEET_NAME);
  const sentencesSheet = ss.getSheetByName(SENTENCES_SHEET_NAME);
  
  // 1. Delete associated sentences
  const sentenceValues = sentencesSheet.getDataRange().getValues();
  const sentenceHeaders = sentenceValues[0];
  const bookIdColIndex = sentenceHeaders.indexOf('bookId');
  const sentenceRowsToDelete = [];
  
  if (bookIdColIndex !== -1) {
    for (let i = 1; i < sentenceValues.length; i++) {
      if (sentenceValues[i][bookIdColIndex] == bookId) {
        sentenceRowsToDelete.push(i + 1);
      }
    }
  }

  // Delete rows in reverse to avoid index shifting issues
  for (let i = sentenceRowsToDelete.length - 1; i >= 0; i--) {
    sentencesSheet.deleteRow(sentenceRowsToDelete[i]);
  }
  
  // 2. Delete the book
  const bookRowIndex = findRowIndexById(booksSheet, bookId, 'id');
  if (bookRowIndex !== -1) {
    booksSheet.deleteRow(bookRowIndex);
  }

  return { status: 'success', message: \`Book \${bookId} and its sentences deleted.\` };
}

/**
 * Deletes a single sentence from the 'Sentences' sheet.
 * @param {string} sentenceId - The ID of the sentence to delete.
 * @returns {object} A success message.
 */
function deleteSentence(sentenceId) {
  if (!sentenceId) throw new Error("sentenceId is required for deletion.");
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SENTENCES_SHEET_NAME);
  const rowIndex = findRowIndexById(sheet, sentenceId, 'id');
  
  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex);
    return { status: 'success', message: \`Sentence \${sentenceId} deleted.\` };
  } else {
    throw new Error(\`Sentence with ID \${sentenceId} not found.\`);
  }
}

// ==================================================================
// UTILITY HELPERS
// ==================================================================

/**
 * Converts spreadsheet data (2D array) into an array of objects.
 * @param {Array<Array<any>>} values - The 2D array from sheet.getDataRange().getValues().
 * @returns {Array<object>} An array of objects, where each object represents a row.
 */
function sheetDataToObjects(values) {
  if (!values || values.length < 2) {
    return []; // Return empty if no headers or data
  }
  const headers = values[0].map(String);
  const data = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    data.push(obj);
  }
  return data;
}

/**
 * Finds the row index (1-based) for a given ID in a sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The sheet to search in.
 * @param {string} id - The ID to find.
 * @param {string} idColumnName - The name of the header for the ID column.
 * @returns {number} The 1-based row index, or -1 if not found.
 */
function findRowIndexById(sheet, id, idColumnName = 'id') {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idColumnIndex = headers.indexOf(idColumnName);
  
  if (idColumnIndex === -1) {
    // If the ID column isn't found, we can't proceed.
    return -1;
  }
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idColumnIndex] == id) {
      return i + 1; // Return 1-based index
    }
  }
  return -1; // Not found
}

/**
 * Creates a standard JSON response object for the ContentService.
 * @param {object} data - The payload to stringify.
 * @returns {GoogleAppsScript.Content.TextOutput} The JSON response.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates a standard JSON error response.
 * @param {Error} error - The error object.
 * @param {string} message - A user-friendly message.
 * @returns {GoogleAppsScript.Content.TextOutput} The JSON error response.
 */
function createErrorResponse(error, message) {
  Logger.log(\`Error: \${message}. Details: \${error.stack}\`);
  const errorResponse = {
    status: 'error',
    message: message,
    error: {
      name: error.name,
      message: error.message,
    }
  };
  return createJsonResponse(errorResponse);
}
`;

const CodeViewer: React.FC<CodeViewerProps> = ({ isOpen, onClose }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy Code');

    const handleCopy = () => {
        navigator.clipboard.writeText(appsScriptCode.trim())
            .then(() => {
                setCopyButtonText('Copied!');
                setTimeout(() => setCopyButtonText('Copy Code'), 2000);
            })
            .catch(err => {
                console.error('Failed to copy code: ', err);
                alert('Failed to copy code.');
            });
    };

    return (
        <aside 
            className={`fixed top-0 right-0 h-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-20 transition-transform duration-300 ease-in-out flex flex-col
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                w-full lg:w-[40%]
            `}
            aria-hidden={!isOpen}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">Backend Code (Google Apps Script)</h2>
                <div className="flex items-center gap-2">
                     <button onClick={handleCopy} className="px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/80">
                        {copyButtonText}
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700" aria-label="Close code viewer">
                        <XIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>
            <div className="p-4 overflow-auto flex-grow">
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-sm text-left whitespace-pre-wrap break-words">
                    <code className="language-javascript">
                        {appsScriptCode.trim()}
                    </code>
                </pre>
            </div>
             <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                Copy this code into your Google Sheet's Apps Script editor (<code>Code.gs</code>). See previous instructions for setup details.
            </div>
        </aside>
    );
};

export default CodeViewer;
