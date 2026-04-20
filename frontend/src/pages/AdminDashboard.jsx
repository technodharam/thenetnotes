import { useState, useEffect } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import { Lock, LogOut, Edit, Trash2, Plus, List } from 'lucide-react';

const advancedNotesData = []; // Fallback empty array

const AdminDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Tabs: 'list_notes', 'edit_note', 'list_blogs', 'edit_blog'
  const [activeTab, setActiveTab] = useState('list_notes');
  const [items, setItems] = useState([]);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'NDS BASICS',
    level: 'Beginner',
    tags: '',
    content: '',
    resources: ''
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'NDS BASICS',
      level: 'Beginner',
      tags: '',
      content: '',
      resources: ''
    });
  };

  const handleDelete = async (itemId) => {
    const isNote = activeTab === 'list_notes';
    const endpoint = isNote ? '/api/notes' : '/api/blogs';
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    try {
      setSuccess('Deleting...');
      await axios.delete(`${API_BASE_URL}${endpoint}/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setItems(items.filter(item => item._id !== itemId));
      setSuccess('Deleted successfully!');
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    if (!token) return;
    if (activeTab === 'edit_note' || activeTab === 'edit_blog') return;

    const fetchItems = async () => {
      try {
        const isNote = activeTab === 'list_notes';
        const endpoint = isNote ? '/api/notes' : '/api/blogs';
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        
        console.log(`Fetching from: ${API_BASE_URL}${endpoint}`);
        const res = await axios.get(`${API_BASE_URL}${endpoint}`);
        setItems(res.data);
      } catch (err) {
        console.error("Fetch failed", err);
        setItems([]);
      }
    };
    fetchItems();
  }, [activeTab, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/login`, { password });
      setToken(res.data.token);
      localStorage.setItem('adminToken', res.data.token);
      setError('');
    } catch (err) {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('adminToken');
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      title: item.title || '',
      category: item.category || 'NDS BASICS',
      level: item.level || 'Beginner',
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags) : '',
      content: item.content || '',
      resources: item.resources || ''
    });
    setActiveTab(activeTab === 'list_notes' ? 'edit_note' : 'edit_blog');
  };

  const handleCreateNew = (type) => {
    resetForm();
    setActiveTab(type === 'note' ? 'edit_note' : 'edit_blog');
  };

  const handleSave = async () => {
    const isNote = activeTab === 'edit_note';
    const endpoint = isNote ? '/api/notes' : '/api/blogs';
    
    try {
      let res;
      if (editingId) {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        // Update existing
        res = await axios.put(`${API_BASE_URL}${endpoint}/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(items.map(item => item._id === editingId ? res.data : item));
      } else {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        // Create new
        res = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems([res.data, ...items]);
      }
      
      setSuccess(`Item ${editingId ? 'updated' : 'created'} successfully!`);
      setActiveTab(isNote ? 'list_notes' : 'list_blogs');
      resetForm();
    } catch (err) {
      console.error("Save failed", err);
      setSuccess('Error: Could not save item to server');
    }
    
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="brutal-card bg-neo-yellow p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-neo-black p-4 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black uppercase text-center mb-6 text-neo-black">Admin Access</h1>
          {error && <div className="bg-red-500 text-white font-bold p-3 mb-4 border-2 border-neo-black">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block font-bold uppercase mb-2 text-neo-black">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full brutal-input bg-neo-white"
                placeholder="Enter admin password"
              />
            </div>
            <button type="submit" className="w-full brutal-btn bg-neo-blue text-white uppercase">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b-4 border-neo-black pb-4">
        <h1 className="text-4xl font-black uppercase text-neo-black">Command Center</h1>
        <button onClick={handleLogout} className="brutal-btn py-2 px-4 bg-neo-pink text-white flex items-center">
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </div>

      {success && (
        <div className="bg-neo-green border-4 border-neo-black p-4 mb-8 text-xl font-black text-center uppercase animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-neo-black">
          {success}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <div className="flex flex-col space-y-4">
            <h3 className="font-black uppercase text-lg border-b-2 border-neo-black pb-1 text-neo-black">Notes</h3>
            <button 
              onClick={() => setActiveTab('list_notes')}
              className={`brutal-btn py-3 text-left flex items-center ${activeTab === 'list_notes' ? 'bg-neo-black text-white' : 'bg-neo-card'}`}
            >
              <List className="w-5 h-5 mr-2" /> Manage Notes
            </button>
            <button 
              onClick={() => handleCreateNew('note')}
              className={`brutal-btn py-3 text-left flex items-center ${activeTab === 'edit_note' ? 'bg-neo-black text-white' : 'bg-neo-green'}`}
            >
              <Plus className="w-5 h-5 mr-2" /> Create Note
            </button>

            <h3 className="font-black uppercase text-lg border-b-2 border-neo-black pb-1 mt-6 text-neo-black">Blogs</h3>
            <button 
              onClick={() => setActiveTab('list_blogs')}
              className={`brutal-btn py-3 text-left flex items-center ${activeTab === 'list_blogs' ? 'bg-neo-black text-white' : 'bg-neo-card'}`}
            >
              <List className="w-5 h-5 mr-2" /> Manage Blogs
            </button>
            <button 
              onClick={() => handleCreateNew('blog')}
              className={`brutal-btn py-3 text-left flex items-center ${activeTab === 'edit_blog' ? 'bg-neo-black text-white' : 'bg-neo-green'}`}
            >
              <Plus className="w-5 h-5 mr-2" /> Create Blog
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-full md:w-3/4">
          
          {/* LIST VIEW */}
          {(activeTab === 'list_notes' || activeTab === 'list_blogs') && (
            <div className="brutal-card bg-neo-card p-8">
              <h2 className="text-3xl font-black mb-6 uppercase text-neo-black">Existing {activeTab === 'list_notes' ? 'Notes' : 'Blogs'}</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="border-4 border-neo-black p-4 flex flex-col md:flex-row md:justify-between md:items-center bg-neo-yellow hover:bg-neo-white transition-colors gap-4">
                    <div className="text-neo-black">
                      <h3 className="font-bold text-xl">{item.title}</h3>
                      {activeTab === 'list_notes' && <span className="text-sm font-black uppercase bg-neo-card text-neo-black px-2 py-1 mt-2 inline-block border-2 border-neo-black">{item.category}</span>}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="brutal-btn bg-neo-blue text-white px-4 py-2 text-sm uppercase flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="brutal-btn bg-neo-pink text-white px-4 py-2 text-sm uppercase flex items-center">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="font-bold text-lg">No items found.</p>}
              </div>
            </div>
          )}

          {/* EDITOR VIEW */}
          {(activeTab === 'edit_note' || activeTab === 'edit_blog') && (
            <div className="brutal-card bg-white p-8">
              <h2 className="text-3xl font-black mb-6 uppercase">
                {editingId ? 'Edit' : 'Create New'} {activeTab === 'edit_note' ? 'Note' : 'Blog'}
              </h2>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block font-bold uppercase mb-2">Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full brutal-input bg-neo-white" 
                    placeholder="Enter title..." 
                  />
                </div>
                
                {activeTab === 'edit_note' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase mb-2">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full brutal-input bg-neo-white cursor-pointer"
                      >
                        <option>NDS BASICS</option>
                        <option>Basics of networking</option>
                        <option>OSPF</option>
                        <option>EIGRP</option>
                        <option>BGP</option>
                        <option>MPLS</option>
                        <option>SWITCHING ADVANCE</option>
                        <option>HSRP UPDATED</option>
                        <option>Headers</option>
                        <option>RIP</option>
                        <option>GRE-Tunnel</option>
                        <option>HSRP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold uppercase mb-2">Level</label>
                      <select 
                        value={formData.level}
                        onChange={(e) => setFormData({...formData, level: e.target.value})}
                        className="w-full brutal-input bg-neo-white cursor-pointer"
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === 'edit_blog' && (
                  <div>
                    <label className="block font-bold uppercase mb-2">Tags (comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.tags}
                      onChange={(e) => setFormData({...formData, tags: e.target.value})}
                      className="w-full brutal-input bg-neo-white" 
                      placeholder="e.g. IPv4, Tips, DNS" 
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold uppercase mb-2">Resources / Links</label>
                  <input 
                    type="text" 
                    value={formData.resources}
                    onChange={(e) => setFormData({...formData, resources: e.target.value})}
                    className="w-full brutal-input bg-neo-white" 
                    placeholder="e.g. https://cisco.com/docs, YouTube Link..." 
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-2">Content (Markdown supported)</label>
                  <div className="border-4 border-neo-black shadow-brutal overflow-hidden">
                    <MDEditor 
                      value={formData.content}
                      onChange={(val) => setFormData({...formData, content: val || ''})}
                      height={400}
                      preview="edit"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={handleSave} className="brutal-btn bg-neo-green w-full uppercase text-lg">
                    {editingId ? 'Update' : 'Publish'} {activeTab === 'edit_note' ? 'Note' : 'Blog'}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => setActiveTab(activeTab === 'edit_note' ? 'list_notes' : 'list_blogs')}
                      className="brutal-btn bg-neo-card w-full uppercase text-lg hover:bg-neo-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
