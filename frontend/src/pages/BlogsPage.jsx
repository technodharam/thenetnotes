import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const BlogsPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const res = await axios.get(`${API_BASE_URL}/api/blogs`);
        setBlogs(res.data);
      } catch (error) {
        console.error("Could not fetch blogs", error);
        setBlogs([
          { 
            _id: '1', 
            title: 'Why you should understand Subnetting', 
            content: 'Subnetting is the practice of dividing a network into two or more smaller networks. It increases routing efficiency, enhances the security of the network and reduces the size of the broadcast domain.\n\n### How to start?\nLearn the powers of 2.', 
            author: 'Admin',
            createdAt: new Date().toISOString(),
            tags: ['IPv4', 'Tips']
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (selectedBlog) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedBlog(null)} className="mb-6 font-bold uppercase underline hover:text-neo-blue">
          ← Back to Blogs
        </button>
        <div className="brutal-card bg-neo-card p-8 md:p-12">
          <h1 className="text-5xl font-black mb-4 uppercase leading-tight">{selectedBlog.title}</h1>
          <div className="flex items-center text-sm font-bold uppercase mb-8 border-b-4 border-neo-black pb-4">
            <span className="mr-4">By {selectedBlog.author}</span>
            <span className="mr-4">{new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
            <div className="flex space-x-2">
              {selectedBlog.tags?.map(tag => (
                <span key={tag} className="bg-neo-pink text-white px-2 py-1 border-2 border-neo-black text-xs">{tag}</span>
              ))}
            </div>
          </div>
          <div className="prose prose-lg max-w-none prose-headings:font-black prose-p:font-medium">
            <ReactMarkdown>{selectedBlog.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10 border-b-4 border-neo-black pb-4">
        <h1 className="text-5xl font-black uppercase text-neo-black">NetBlog</h1>
        <div className="bg-neo-yellow px-4 py-2 border-4 border-neo-black font-bold uppercase transform rotate-2 text-neo-black">Latest Insights</div>
      </div>
      
      {loading ? (
        <div className="font-bold text-xl">Loading...</div>
      ) : (
        <div className="space-y-8">
          {blogs.map((blog, idx) => (
            <div key={blog._id} className="brutal-card bg-neo-card flex flex-col md:flex-row overflow-hidden relative group">
              <div className={`w-full md:w-8 block ${idx % 2 === 0 ? 'bg-neo-blue' : 'bg-neo-pink'} border-b-4 md:border-b-0 md:border-r-4 border-neo-black`}></div>
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                <div>
                   <div className="flex space-x-2 mb-3">
                    {blog.tags?.map(tag => (
                      <span key={tag} className="bg-neo-yellow px-2 py-1 border-2 border-neo-black text-xs font-bold uppercase text-neo-black">{tag}</span>
                    ))}
                  </div>
                   <h2 className="text-3xl font-black mb-2 uppercase group-hover:underline cursor-pointer text-neo-black" onClick={() => setSelectedBlog(blog)}>{blog.title}</h2>
                  <p className="font-medium text-neo-black opacity-80 line-clamp-2 mb-4">{blog.content}</p>
                </div>
                 <div className="flex justify-between items-center mt-4">
                  <span className="font-bold text-sm uppercase text-neo-black">By {blog.author}</span>
                  <button onClick={() => setSelectedBlog(blog)} className="brutal-btn py-2 px-4 bg-neo-green text-sm text-neo-black">Read More</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
