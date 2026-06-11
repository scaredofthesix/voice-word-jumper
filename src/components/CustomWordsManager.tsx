import React, { useState } from 'react';
import { WordData } from '../types';
import { speakWord } from '../utils';
import { Plus, Trash2, Volume2, AlertCircle } from 'lucide-react';

interface CustomWordsManagerProps {
  customWords: WordData[];
  onAddWord: (word: string, translation: string) => void;
  onDeleteWord: (index: number) => void;
  onClearAll: () => void;
}

export const CustomWordsManager: React.FC<CustomWordsManagerProps> = ({
  customWords,
  onAddWord,
  onDeleteWord,
  onClearAll,
}) => {
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedWord = newWord.trim();
    const trimmedTranslation = newTranslation.trim();

    if (!trimmedWord) {
      setError('Please write an English word!');
      return;
    }

    if (!trimmedTranslation) {
      setError('Please add a fun clue or hint!');
      return;
    }

    if (!/^[a-zA-Z\s\-]+$/.test(trimmedWord)) {
      setError('Letters only, please!');
      return;
    }

    onAddWord(trimmedWord, trimmedTranslation);
    setNewWord('');
    setNewTranslation('');
    
    speakWord(trimmedWord);
  };

  return (
    <div className="space-y-5" id="custom-words-setup">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5 ml-1">
              English Word:
            </label>
            <input
              type="text"
              placeholder="e.g. Rabbit"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full bg-white border-4 border-slate-900 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-slate-400 transition-all font-bold"
              id="input-custom-english-word"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5 ml-1">
              Fun Clue:
            </label>
            <input
              type="text"
              placeholder="e.g. Fluffy hopper"
              value={newTranslation}
              onChange={(e) => setNewTranslation(e.target.value)}
              className="w-full bg-white border-4 border-slate-900 text-slate-800 text-xs px-4 py-3 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-200 placeholder:text-slate-400 transition-all font-bold"
              id="input-custom-russian-translation"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-700 bg-rose-100 border-4 border-rose-500 p-3 rounded-2xl font-black flex items-center gap-2 animate-bounce">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-1 active:shadow-none bubble-shadow-pink"
          id="btn-add-custom-word"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> ADD TO MY RACING LIST!
        </button>
      </form>

      {/* Vocabulary list display */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-black uppercase tracking-wider text-purple-600">
            MY CUSTOM DICTIONARY ({customWords.length})
          </span>
          {customWords.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-extrabold cursor-pointer transition-colors uppercase tracking-widest bg-white border-2 border-slate-900 px-2 py-0.5 rounded-lg"
              id="btn-clear-custom-words"
            >
              Clear All
            </button>
          )}
        </div>

        {customWords.length === 0 ? (
          <div className="bg-amber-100/50 border-4 border-dashed border-amber-300 rounded-2xl p-5 text-center">
            <p className="text-xs text-amber-800 font-black">Your driving dictionary is empty. Put a word and a fun clue above!</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {customWords.map((item, index) => (
              <div
                key={index}
                className="bg-white border-4 border-slate-900 px-4 py-3 rounded-2xl flex items-center justify-between group shadow-sm hover:translate-y-[-1px] transition-transform"
                id={`custom-word-row-${index}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-black text-sm tracking-wide bg-purple-100 border-2 border-slate-900 px-2 py-0.5 rounded-lg">{item.word}</span>
                  <span className="text-xs text-slate-400 font-black">➔</span>
                  <span className="text-slate-600 text-xs font-black">{item.translation}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => speakWord(item.word)}
                    title="Speak word"
                    className="p-1.5 bg-yellow-100 hover:bg-yellow-200 border-2 border-slate-900 text-slate-800 rounded-xl cursor-pointer transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteWord(index)}
                    title="Delete word"
                    className="p-1.5 bg-rose-150 hover:bg-rose-200 border-2 border-slate-900 text-rose-600 rounded-xl cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
