import React, { useState } from 'react';
import { BookOpenIcon } from './icons';

interface ConfigurationGuideProps {
    onSave: (url: string) => void;
}

const ConfigurationGuide: React.FC<ConfigurationGuideProps> = ({ onSave }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim().startsWith('https://script.google.com/macros/s/')) {
            onSave(url.trim());
        } else {
            alert('Please enter a valid Google Apps Script Web App URL. It should start with "https://script.google.com/macros/s/".');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
            <div className="max-w-4xl w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-center items-center mb-4">
                    <BookOpenIcon className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Welcome to Reading Log!</h2>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">To get started, please connect your Google Sheet backend.</p>

                <form onSubmit={handleSubmit} className="mt-6 w-full max-w-lg mx-auto">
                    <label htmlFor="apiUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Google Apps Script Web App URL
                    </label>
                    <input
                        id="apiUrl"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://script.google.com/macros/s/..."
                        required
                        className="block w-full px-4 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="mt-4 w-full px-4 py-2 text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Save and Start
                    </button>
                </form>

                <div className="mt-8 text-left border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">How to get the URL:</h3>
                    <ol className="list-decimal list-inside mt-4 space-y-3 text-gray-600 dark:text-gray-400">
                        <li>
                            <strong>Create a new Google Sheet.</strong> Create two tabs named exactly `Books` and `Sentences` (case-sensitive).
                        </li>
                        <li>
                            <strong>Set up headers:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                <li>In `Books` sheet (Row 1): `id`, `title`, `author`, `publisher`, `isbn`, `coverImage`, `createdAt`</li>
                                <li>In `Sentences` sheet (Row 1): `id`, `bookId`, `text`, `page`, `createdAt`</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Open Apps Script:</strong> Go to `Extensions` &gt; `Apps Script`.
                        </li>
                        <li>
                            {/* FIX: The unescaped `</>` was likely confusing the JSX parser. It has been wrapped in a string expression. */}
                            <strong>Paste the Code:</strong> Copy the backend code (click the {'`</>`'} icon in the header) and paste it into `Code.gs`, replacing any existing content.
                        </li>
                        <li>
                            <strong>Deploy as Web App:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                <li>Click **Deploy** &gt; **New deployment**.</li>
                                <li>Set "Execute as" to **Me**.</li>
                                <li>Set "Who has access" to **Anyone**. **This is very important!**</li>
                                <li>Click **Deploy**. Grant permissions when prompted.</li>
                            </ul>
                        </li>
                        <li>
                            <strong>Copy & Paste URL:</strong> After deploying, copy the **Web app URL** and paste it into the input box above.
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationGuide;
