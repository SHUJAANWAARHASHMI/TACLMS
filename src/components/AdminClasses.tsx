import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClassRoom, Subject, Chapter } from '../types';
import { FolderPlus, BookOpen, Plus, Trash2, Library, ListOrdered } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminClasses() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Selection states
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Form states
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterOrder, setNewChapterOrder] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const [allClasses, allSubjects, allChapters] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setClasses(allClasses);
      setSubjects(allSubjects);
      setChapters(allChapters);
      
      // Keep selection or auto-select
      if (allClasses.length > 0 && !selectedClass) {
        setSelectedClass(allClasses[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const cls = await api.createClass(newClassName, newClassDesc);
      setNewClassName('');
      setNewClassDesc('');
      await loadHierarchy();
      setSelectedClass(cls);
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Are you sure? This will delete the class and all subjects/chapters inside it.')) return;
    try {
      await api.deleteClass(id);
      setSelectedClass(null);
      await loadHierarchy();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !newSubjectName.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      await api.createSubject(selectedClass.id, newSubjectName);
      setNewSubjectName('');
      await loadHierarchy();
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject and its chapters?')) return;
    try {
      await api.deleteSubject(id);
      setSelectedSubject(null);
      await loadHierarchy();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newChapterTitle.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const order = newChapterOrder ? Number(newChapterOrder) : undefined;
      await api.createChapter(selectedSubject.id, newChapterTitle, order);
      setNewChapterTitle('');
      setNewChapterOrder('');
      await loadHierarchy();
    } catch (err: any) {
      setError(err.message || 'Failed to create chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!window.confirm('Delete this chapter?')) return;
    try {
      await api.deleteChapter(id);
      await loadHierarchy();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="classes-manager-root">
      
      {/* COLUMN 1: Classes Manager */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="classes-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <FolderPlus size={16} className="text-sky-500" />
          <span>Step 1: Classes / Grade Slots</span>
        </h3>

        {/* Create Class Form */}
        <form onSubmit={handleCreateClass} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100" id="create-class-form">
          <div className="text-xs font-semibold text-slate-500">Create Class Slot</div>
          <input
            type="text"
            required
            placeholder="Class Name (e.g. 9th Grade)"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
            id="class-name-input"
          />
          <input
            type="text"
            placeholder="Short Description..."
            value={newClassDesc}
            onChange={(e) => setNewClassDesc(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
            id="class-desc-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            id="class-submit-btn"
          >
            <Plus size={14} />
            <span>Add Class Slot</span>
          </button>
        </form>

        {/* Classes Table / Buttons */}
        <div className="space-y-2" id="classes-items-list">
          {classes.map((cls) => (
            <div 
              key={cls.id}
              className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                selectedClass?.id === cls.id
                  ? 'bg-sky-50 border-sky-200'
                  : 'bg-white border-slate-100 hover:bg-slate-50/50'
              }`}
              onClick={() => { setSelectedClass(cls); setSelectedSubject(null); }}
              id={`class-row-${cls.id}`}
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800">{cls.name}</h4>
                <p className="text-[10px] text-slate-400">{cls.description || 'No description guidelines'}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: Subjects under Class */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="subjects-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <BookOpen size={16} className="text-amber-500" />
          <span>Step 2: Course Subjects</span>
        </h3>

        {selectedClass ? (
          <div className="space-y-4">
            <div className="bg-sky-50 border border-sky-100 px-3.5 py-2.5 rounded-xl text-xs text-sky-800 font-semibold" id="subject-active-class-hint">
              Selected: <span className="font-bold">{selectedClass.name}</span>
            </div>

            {/* Create Subject Form */}
            <form onSubmit={handleCreateSubject} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100" id="create-subject-form">
              <div className="text-xs font-semibold text-slate-500">Create Subject</div>
              <input
                type="text"
                required
                placeholder="e.g. Physics, Computer Science"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
                id="subject-name-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                id="subject-submit-btn"
              >
                <Plus size={14} />
                <span>Link Subject</span>
              </button>
            </form>

            {/* Subjects List */}
            <div className="space-y-2" id="subjects-items-list">
              {subjects.filter(s => s.classId === selectedClass.id).map((sub) => (
                <div 
                  key={sub.id}
                  className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedSubject?.id === sub.id
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-white border-slate-100 hover:bg-slate-50/50'
                  }`}
                  onClick={() => setSelectedSubject(sub)}
                  id={`subject-row-${sub.id}`}
                >
                  <h4 className="text-xs font-bold text-slate-800">{sub.name}</h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteSubject(sub.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {subjects.filter(s => s.classId === selectedClass.id).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">
                  No subjects linked to this class yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-6">
            Please select a class grade slot from step 1 column first.
          </div>
        )}
      </div>

      {/* COLUMN 3: Chapters under Subject */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="chapters-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <Library size={16} className="text-teal-500" />
          <span>Step 3: Chapter Segments</span>
        </h3>

        {selectedSubject ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 px-3.5 py-2.5 rounded-xl text-xs text-amber-800 font-semibold" id="chapter-active-subject-hint">
              Selected Course: <span className="font-bold">{selectedSubject.name}</span>
            </div>

            {/* Create Chapter Form */}
            <form onSubmit={handleCreateChapter} className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100" id="create-chapter-form">
              <div className="text-xs font-semibold text-slate-500">Add Chapter</div>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 1: Kinematics"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
                id="chapter-title-input"
              />
              <input
                type="number"
                placeholder="Folder Order (defaults to last index)"
                value={newChapterOrder}
                onChange={(e) => setNewChapterOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
                id="chapter-order-input"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                id="chapter-submit-btn"
              >
                <Plus size={14} />
                <span>Create Chapter Folder</span>
              </button>
            </form>

            {/* Chapters List */}
            <div className="space-y-2" id="chapters-items-list">
              {chapters.filter(c => c.subjectId === selectedSubject.id).map((chap) => (
                <div 
                  key={chap.id}
                  className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50"
                  id={`chapter-row-${chap.id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono">
                      #{chap.order}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">{chap.title}</h4>
                  </div>
                  <button
                    onClick={() => handleDeleteChapter(chap.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {chapters.filter(c => c.subjectId === selectedSubject.id).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">
                  No chapters defined in this subject folder yet.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 text-center py-6">
            Please select a subject from step 2 column first.
          </div>
        )}
      </div>

    </div>
  );
}
