import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BookOpen } from 'lucide-react';
import mermaid from 'mermaid';

const dummyNotesData = []; // Fallback empty array

const Mermaid = ({ chart }) => {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'base',
      themeVariables: {
        primaryColor: '#ffeb3b', // neo-yellow
        primaryTextColor: '#000',
        primaryBorderColor: '#000',
        lineColor: '#000',
        secondaryColor: '#4d9bff', // neo-blue
        tertiaryColor: '#fff',
      }
    });
    mermaid.contentLoaded();
  }, [chart]);

  return <div className="mermaid bg-neo-card p-4 border-4 border-neo-black shadow-brutal my-6">{chart}</div>;
};

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // Will fail gracefully if backend not running
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const res = await axios.get(`${API_BASE_URL}/api/notes`);
        setNotes(res.data);
      } catch (error) {
        console.error("Could not fetch notes, loading local data", error);
        const localNotes = localStorage.getItem('localNotes');
        if (localNotes) {
          setNotes(JSON.parse(localNotes));
        } else {
          setNotes(dummyNotesData);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const [showCategoryView, setShowCategoryView] = useState(false);

  const categories = ['All', ...new Set(notes.map(n => n.category))];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredNotes = activeCategory === 'All' ? notes : notes.filter(n => n.category === activeCategory);

  // Updated category button click handler
  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    setSelectedNote(null);
    setShowCategoryView(cat !== 'All');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <div className="w-full md:w-1/4">
        <h1 className="text-3xl font-black mb-6 uppercase border-b-4 border-neo-black pb-2 inline-block text-neo-black">Categories</h1>
        <div className="flex flex-col space-y-2">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`text-left font-bold text-lg p-3 border-4 border-neo-black transition-transform hover:-translate-y-1 hover:shadow-brutal ${activeCategory === cat ? 'bg-neo-blue text-white shadow-brutal translate-x-2' : 'bg-neo-card'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-3/4">
        {selectedNote ? (
          <div className="brutal-card bg-neo-card p-8">
            <button onClick={() => setSelectedNote(null)} className="mb-6 font-bold uppercase underline hover:text-neo-blue">
              ← Back to List
            </button>
            <div className="mb-4 flex items-center space-x-3">
              <span className="bg-neo-yellow font-bold text-xs px-2 py-1 border-2 border-neo-black uppercase text-neo-black">{selectedNote.category}</span>
              <span className="bg-neo-green font-bold text-xs px-2 py-1 border-2 border-neo-black uppercase text-neo-black">{selectedNote.level}</span>
            </div>
            <h1 className="text-4xl font-black mb-6 border-b-4 border-neo-black pb-4">{selectedNote.title}</h1>
            <div className="prose prose-lg max-w-none prose-headings:font-black prose-a:text-neo-blue prose-pre:bg-neo-black prose-pre:text-neo-green prose-pre:border-4 prose-pre:border-neo-black">
              <ReactMarkdown
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'mermaid') {
                      return <Mermaid chart={String(children).replace(/\\n$/, '')} />;
                    }
                    return <code className={className} {...props}>{children}</code>;
                  }
                }}
              >
                {selectedNote.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : showCategoryView && activeCategory !== 'All' ? (
          <div className="brutal-card bg-neo-card p-8 md:p-12">
            <button onClick={() => setShowCategoryView(false)} className="mb-6 font-bold uppercase underline hover:text-neo-blue">
              ← Back to Categories
            </button>
            <h1 className="text-4xl font-black mb-6 uppercase">{activeCategory} Overview</h1>
            {filteredNotes.map(note => (
              <div key={note._id} className="mb-8">
                <h2 className="text-2xl font-black mb-3">{note.title}</h2>
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      if (!inline && match && match[1] === 'mermaid') {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                      }
                      return <code className={className} {...props}>{children}</code>;
                    }
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <h1 className="text-4xl font-black mb-6 uppercase text-neo-black">Notes ({filteredNotes.length})</h1>
            {loading ? (
              <div className="font-bold text-xl">Loading notes...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredNotes.map(note => (
                  <div key={note._id} onClick={() => setSelectedNote(note)} className="brutal-card bg-neo-white p-6 cursor-pointer hover:bg-neo-yellow group flex flex-col justify-between h-full">
                    <div>
                      <div className="mb-3 flex space-x-2">
                        <span className="bg-neo-card font-bold text-[10px] px-2 py-1 border-2 border-neo-black uppercase text-neo-black">{note.category}</span>
                      </div>
                      <h2 className="text-2xl font-black mb-3 group-hover:text-neo-blue">{note.title}</h2>
                      <p className="font-medium text-neo-black opacity-80 line-clamp-2 mb-4">{note.content}</p>
                    </div>
                    <div className="mt-4 flex items-center font-bold uppercase text-sm border-t-2 border-neo-black pt-2">
                      <BookOpen className="w-4 h-4 mr-2" /> Read Note
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
