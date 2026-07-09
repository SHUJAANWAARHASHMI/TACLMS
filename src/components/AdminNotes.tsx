import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { ClassRoom, Subject, Chapter, Note } from '../types';
import { FileUp, FileText, Trash2, ArrowRight, Tags, ShieldAlert, History, Edit } from 'lucide-react';

export default function AdminNotes() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Form upload fields
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Update state
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Drag and drop / UI states
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSelectors();
    loadNotes();
  }, []);

  const loadSelectors = async () => {
    try {
      const [allClasses, allSubjects, allChapters] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setClasses(allClasses);
      setSubjects(allSubjects);
      setChapters(allChapters);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNotes = async () => {
    try {
      const allNotes = await api.getNotes();
      setNotes(allNotes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedChapterId) {
      setError('Please select a target chapter first.');
      return;
    }
    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!file && !editingNote) {
      setError('Please select a PDF, Word, or Image file to upload.');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('chapterId', selectedChapterId);
      fd.append('title', title);
      fd.append('tags', tags);
      fd.append('downloadAllowed', String(downloadAllowed));
      fd.append('viewOnly', String(viewOnly));
      
      if (file) {
        fd.append('file', file);
      }
      if (editingNote) {
        fd.append('noteId', editingNote.id);
      }

      await api.uploadNote(fd);
      setSuccess(true);
      
      // Reset form fields
      setTitle('');
      setTags('');
      setFile(null);
      setEditingNote(null);
      
      await loadNotes();
    } catch (err: any) {
      setError(err.message || 'File upload failed. Ensure server space and correct MIME type.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this study note? Physical file on disk will be wiped.')) return;
    try {
      await api.deleteNote(id);
      await loadNotes();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setTags(note.tags.join(', '));
    setDownloadAllowed(note.downloadAllowed);
    setViewOnly(note.viewOnly);
    
    // Auto populate selectors
    const chap = chapters.find(c => c.id === note.chapterId);
    if (chap) {
      setSelectedChapterId(chap.id);
      const sub = subjects.find(s => s.id === chap.subjectId);
      if (sub) {
        setSelectedSubjectId(sub.id);
        setSelectedClassId(sub.classId);
      }
    }
  };

  // Filter lists based on selection cascade
  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="notes-manager-root">
      
      {/* COLUMN 1: Note Upload / Configurations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="upload-form-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <FileUp size={16} className="text-sky-500" />
          <span>{editingNote ? 'Modify Learning Note' : 'Upload Study Document'}</span>
        </h3>

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-semibold text-slate-500" id="note-uploader-form">
          
          {/* Target Chapter Cascade Selectors */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1">Target Class Grade Slot</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                id="notes-class-select"
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1">Target Subject Category</label>
              <select
                required
                disabled={!selectedClassId}
                value={selectedSubjectId}
                onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-40"
                id="notes-sub-select"
              >
                <option value="">-- Choose Subject --</option>
                {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1">Target Chapter Folder</label>
              <select
                required
                disabled={!selectedSubjectId}
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-40"
                id="notes-chap-select"
              >
                <option value="">-- Choose Chapter Folder --</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          {/* Core metadata details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block mb-1">Document Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Kinematics Chapter 1 Solved Numericals"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="note-title-input"
              />
            </div>

            <div>
              <label className="block mb-1">Search Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Important, Exam Focus, Solved"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="note-tags-input"
              />
            </div>
          </div>

          {/* Secure permissions toggles */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5" id="security-toggles">
            <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wide flex items-center gap-1">
              <ShieldAlert size={12} />
              <span>Secure Reader Configurations</span>
            </div>
            
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={downloadAllowed}
                onChange={(e) => setDownloadAllowed(e.target.checked)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-400 h-4 w-4"
              />
              <span>Allow direct PDF/File downloads</span>
            </label>

            <label className="flex items-center gap-2 text-slate-600 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={viewOnly}
                onChange={(e) => setViewOnly(e.target.checked)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-400 h-4 w-4"
              />
              <span>Secure Reader Mode (Block Downloads & Copy)</span>
            </label>
          </div>

          {/* File Attachment field with Drag and Drop */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/10 rounded-xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-1.5"
            id="admin-drag-drop"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
            />
            <FileText size={24} className="text-slate-400" />
            <div className="space-y-0.5">
              <p className="text-slate-700 font-bold">
                {file ? file.name : (editingNote ? 'Click to re-upload / update file' : 'Drag & Drop Study Document here')}
              </p>
              <p className="text-[10px] text-gray-400">
                PDF, Word, PPT, or images (Max 25MB)
              </p>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          {success && <p className="text-xs text-teal-600 font-bold">Document compiled and published successfully!</p>}

          <div className="flex gap-2">
            {editingNote && (
              <button
                type="button"
                onClick={() => { setEditingNote(null); setTitle(''); setTags(''); setFile(null); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer text-center"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={uploading}
              className="flex-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:bg-sky-300"
              id="notes-upload-submit"
            >
              <span>{uploading ? 'Processing File...' : (editingNote ? 'Save Update' : 'Publish Document')}</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </form>
      </div>

      {/* COLUMN 2 & 3: Notes Directory & Version Hist */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="notes-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <FileText size={16} className="text-amber-500" />
          <span>Active Learning Document Directory</span>
        </h3>

        <div className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1" id="notes-directory-list">
          {notes.map((note) => {
            const chap = chapters.find(c => c.id === note.chapterId);
            const sub = chap ? subjects.find(s => s.id === chap.subjectId) : null;
            const cls = sub ? classes.find(c => c.id === sub.classId) : null;

            return (
              <div key={note.id} className="border border-gray-100 p-4 rounded-xl space-y-3" id={`note-item-admin-${note.id}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">
                        {cls ? cls.name : 'Unknown Class'} &rarr; {sub ? sub.name : 'Unknown Subject'}
                      </span>
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full">
                        {chap ? chap.title : 'Chapter Folder'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{note.title}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">
                      File: {note.originalName} ({Math.round(note.size / 1024)} KB)
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit note configurations"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Tags and configs strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-50 pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tags size={10} className="text-slate-400" />
                    {note.tags.map((t, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {t}
                      </span>
                    ))}
                    {note.tags.length === 0 && <span className="italic">No tags</span>}
                  </div>

                  <div className="flex items-center gap-3 font-semibold text-slate-500">
                    <span>Downloads: <span className={note.downloadAllowed ? 'text-teal-600' : 'text-red-500'}>{note.downloadAllowed ? 'Yes' : 'No'}</span></span>
                    <span>Secure Reader: <span className={note.viewOnly ? 'text-teal-600' : 'text-slate-400'}>{note.viewOnly ? 'Active' : 'Inactive'}</span></span>
                  </div>
                </div>

                {/* Versions History list logs */}
                {note.versions && note.versions.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-[10px] space-y-1.5" id={`versions-log-${note.id}`}>
                    <div className="flex items-center gap-1 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <History size={11} />
                      <span>Version Archives ({note.versions.length})</span>
                    </div>
                    {note.versions.map((ver, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-500 font-mono">
                        <span>v{ver.version}: {ver.originalName}</span>
                        <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {notes.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No lecture notes uploaded yet. Choose target parameters on the left card to upload first.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
