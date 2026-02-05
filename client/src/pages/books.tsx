import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Download, ExternalLink, Search } from "lucide-react";
import { type Book } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import booksBackground from "@/assets/books-background.jpg";

function getLocalizedTitle(book: Book, language: string): string {
  if (language === 'ru' && book.titleRu) return book.titleRu;
  if (language === 'en' && book.titleEn) return book.titleEn;
  return book.title;
}

function getLocalizedDescription(book: Book, language: string): string | null {
  if (language === 'ru' && book.descriptionRu) return book.descriptionRu;
  if (language === 'en' && book.descriptionEn) return book.descriptionEn;
  return book.description;
}

function BookCard({ book, language, onClick }: { book: Book; language: string; onClick: () => void }) {
  const title = getLocalizedTitle(book, language);
  
  return (
    <div 
      className="group relative cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-2 flex flex-col items-center"
      onClick={onClick}
      data-testid={`book-card-${book.id}`}
    >
      <div className="relative h-64 w-44 rounded-md shadow-lg overflow-hidden bg-gradient-to-br from-amber-100 to-amber-50 border-l-4 border-amber-800">
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5" />
        
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <BookOpen className="h-12 w-12 text-amber-700 mb-3" />
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-900/30" />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 pt-8">
          <p className="text-sm font-semibold text-white line-clamp-2 leading-tight text-center">
            {title}
          </p>
          {book.author && (
            <p className="text-xs text-white/70 mt-1 line-clamp-1 text-center">
              {book.author}
            </p>
          )}
        </div>
      </div>
      
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-2 bg-black/10 rounded-full blur-sm group-hover:w-44 transition-all" />
    </div>
  );
}

function Bookshelf({ books, language, onBookClick }: { books: Book[]; language: string; onBookClick: (book: Book) => void }) {
  if (books.length === 0) return null;
  
  return (
    <div className="relative mb-16">
      <div className="flex flex-wrap gap-6 justify-center items-end min-h-[280px] px-4 py-6 relative z-10">
        {books.map((book) => (
          <BookCard 
            key={book.id} 
            book={book} 
            language={language} 
            onClick={() => onBookClick(book)}
          />
        ))}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 rounded-sm shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-amber-700" />
        <div className="absolute inset-x-0 bottom-0 h-2 bg-amber-950" />
      </div>
      
      <div className="absolute -bottom-4 left-4 right-4 h-4 bg-gradient-to-b from-amber-950/50 to-transparent" />
    </div>
  );
}

export default function BooksPage() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  
  const { data: books, isLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });
  
  const filteredBooks = books?.filter((book) => {
    const title = getLocalizedTitle(book, language).toLowerCase();
    const author = (book.author || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || author.includes(query);
  }) || [];
  
  const booksPerShelf = 5;
  const shelves: Book[][] = [];
  for (let i = 0; i < filteredBooks.length; i += booksPerShelf) {
    shelves.push(filteredBooks.slice(i, i + booksPerShelf));
  }
  
  const getLabels = () => {
    if (language === 'ru') {
      return {
        title: "Библиотека документов",
        subtitle: "Карта Таджикистана",
        search: "Поиск книг и документов...",
        backToMap: "На карту",
        author: "Автор",
        year: "Год",
        download: "Скачать",
        open: "Открыть",
        noBooks: "Документы не найдены",
        addFromAdmin: "Добавьте документы через админ-панель",
        noResults: "По вашему запросу ничего не найдено",
      };
    } else if (language === 'en') {
      return {
        title: "Document Library",
        subtitle: "Map of Tajikistan",
        search: "Search books and documents...",
        backToMap: "Back to map",
        author: "Author",
        year: "Year",
        download: "Download",
        open: "Open",
        noBooks: "No documents found",
        addFromAdmin: "Add documents from the admin panel",
        noResults: "No results found for your search",
      };
    }
    return {
      title: "Китобхонаи ҳуҷҷатҳо",
      subtitle: "Харитаи Тоҷикистон",
      search: "Ҷустуҷӯи китобҳо ва ҳуҷҷатҳо...",
      backToMap: "Ба харита",
      author: "Муаллиф",
      year: "Сол",
      download: "Боргирӣ",
      open: "Кушодан",
      noBooks: "Ҳуҷҷат ёфт нашуд",
      addFromAdmin: "Ҳуҷҷатҳоро аз панели администратор илова кунед",
      noResults: "Ягон натиҷа аз рӯи дархости шумо ёфт нашуд",
    };
  };
  
  const labels = getLabels();
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${booksBackground})` }}
      />
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">
      <div className="pointer-events-none absolute left-0 top-0 z-50 flex w-full items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="pointer-events-auto flex items-center gap-4">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              data-testid="button-back-to-map"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {labels.backToMap}
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold text-white tracking-wider drop-shadow-lg">
              {labels.title}
            </h1>
            <p className="text-white/60 text-sm font-light tracking-widest mt-1">{labels.subtitle}</p>
          </div>
        </div>
        <div className="pointer-events-auto">
          <LanguageSwitcher />
        </div>
      </div>
      
      <div className="pt-32 px-4 md:px-8 pb-12">
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <Input
              type="text"
              placeholder={labels.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-stone-800/50 border-stone-700 text-white placeholder:text-stone-500 focus:border-amber-600 focus:ring-amber-600/20"
              data-testid="input-search-books"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-6 justify-center">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-44 rounded-md bg-stone-700" />
              ))}
            </div>
          </div>
        ) : books?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-24 w-24 text-stone-600 mb-6" />
            <p className="text-2xl text-stone-400 font-semibold mb-2">{labels.noBooks}</p>
            <p className="text-stone-500">{labels.addFromAdmin}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Search className="h-16 w-16 text-stone-600 mb-6" />
            <p className="text-xl text-stone-400">{labels.noResults}</p>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {shelves.map((shelfBooks, index) => (
              <Bookshelf 
                key={index} 
                books={shelfBooks} 
                language={language} 
                onBookClick={setSelectedBook}
              />
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 border border-slate-500/50 text-white shadow-2xl shadow-black/50">
          <DialogHeader>
            <div className="flex gap-6">
              {selectedBook?.coverUrl ? (
                <img 
                  src={selectedBook.coverUrl} 
                  alt={selectedBook ? getLocalizedTitle(selectedBook, language) : ""}
                  className="w-32 h-48 object-cover rounded-md shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-32 h-48 bg-gradient-to-br from-amber-100 to-amber-50 rounded-md shadow-lg flex-shrink-0 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-amber-700" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-white mb-2">
                  {selectedBook && getLocalizedTitle(selectedBook, language)}
                </DialogTitle>
                {selectedBook?.author && (
                  <p className="text-amber-400 mb-1">
                    <span className="text-slate-400">{labels.author}:</span> {selectedBook.author}
                  </p>
                )}
                {selectedBook?.year && (
                  <p className="text-slate-200 mb-2">
                    <span className="text-slate-400">{labels.year}:</span> {selectedBook.year}
                  </p>
                )}
                {selectedBook && getLocalizedDescription(selectedBook, language) && (
                  <p className="text-slate-200 leading-relaxed text-sm">
                    {getLocalizedDescription(selectedBook, language)}
                  </p>
                )}
              </div>
            </div>
          </DialogHeader>
          
          {selectedBook?.documentUrl && (
            <div className="flex gap-3 mt-6">
              <a
                href={selectedBook.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-open-document">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {labels.open}
                </Button>
              </a>
              <a
                href={selectedBook.documentUrl}
                download
              >
                <Button variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-600" data-testid="button-download-document">
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}