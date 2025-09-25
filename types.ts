export interface Sentence {
  id: string;
  bookId: string;
  text: string;
  page: number | null;
  createdAt: string;
}

export interface Book {
  id:string;
  title: string;
  author: string;
  publisher?: string;
  isbn?: string;
  coverImage: string;
  createdAt: string;
}

export type SearchType = 'sentence' | 'title' | 'author' | 'publisher' | 'isbn';