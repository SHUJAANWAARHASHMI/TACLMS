import React, { useState } from 'react';
import { 
  Sparkles, X, Calculator, BookOpen, Volume2, VolumeX, Search, HelpCircle, Eye, RefreshCw
} from 'lucide-react';

interface EasyAssistantProps {
  currentSubject?: string;
  notesText?: string;
}

export default function EasyAssistant({ currentSubject, notesText }: EasyAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dictionary' | 'calculator' | 'formulas' | 'speech'>('dictionary');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculator States
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  // Speech States
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  // Common Board Examination Vocabulary List (English to Urdu translation)
  const vocabulary = [
    { eng: 'Acceleration', ur: 'اسرع (رفتار کی تبدیلی کی شرح)', cat: 'Physics' },
    { eng: 'Velocity', ur: 'رفتار / سمت رفتار', cat: 'Physics' },
    { eng: 'Displacement', ur: 'فاصلہ (کم سے کم سمتی فاصلہ)', cat: 'Physics' },
    { eng: 'Momentum', ur: 'مومنٹم / معیارِ حرکت', cat: 'Physics' },
    { eng: 'Equilibrium', ur: 'توازن / حالتِ اعتدال', cat: 'Physics' },
    { eng: 'Frequency', ur: 'تعدد / فریکوئنسی', cat: 'Physics' },
    { eng: 'Wavelength', ur: 'طولِ موج (ویو لینتھ)', cat: 'Physics' },
    { eng: 'Photosynthesis', ur: 'ضیائی تالیف (پودوں کا غذا بنانا)', cat: 'Biology' },
    { eng: 'Metabolism', ur: 'مجموعہ عواملِ زندگی (میٹابولزم)', cat: 'Biology' },
    { eng: 'Osmosis', ur: 'نفوذ / نفوذی دباؤ', cat: 'Biology' },
    { eng: 'Electrolysis', ur: 'برقی پاشیدگی / الیکٹرولائسز', cat: 'Chemistry' },
    { eng: 'Catalyst', ur: 'محرک / عمل انگیز', cat: 'Chemistry' },
    { eng: 'Valency', ur: 'گنجائشِ ملاپ (ویلینسی)', cat: 'Chemistry' },
    { eng: 'Solution', ur: 'محلول / آمیزہ', cat: 'Chemistry' },
    { eng: 'Acid', ur: 'تیزاب / تیزابی مادہ', cat: 'Chemistry' },
    { eng: 'Base', ur: 'اساس / الکلی', cat: 'Chemistry' },
    { eng: 'Derivative', ur: 'تغیراتی شرح / ڈیریویٹیو', cat: 'Maths' },
    { eng: 'Integration', ur: 'تکمیل / انٹیگریشن', cat: 'Maths' },
    { eng: 'Equation', ur: 'مساوات', cat: 'Maths' },
    { eng: 'Matrix', ur: 'قالب (میٹرکس)', cat: 'Maths' },
    { eng: 'Determinant', ur: 'مقطع (ڈیٹرمیننٹ)', cat: 'Maths' },
    { eng: 'Quadratic Formula', ur: 'دو درجی فارمولا', cat: 'Maths' }
  ];

  // Common Board Formulas
  const formulas = [
    { name: 'Newton\'s Second Law', eq: 'F = m × a', desc: 'Force = mass × acceleration', sub: 'Physics' },
    { name: 'Kinetic Energy', eq: 'K.E = ½ m v²', desc: 'Energy of motion', sub: 'Physics' },
    { name: 'Ohm\'s Law', eq: 'V = I × R', desc: 'Voltage = Current × Resistance', sub: 'Physics' },
    { name: 'Quadratic Equation Solution', eq: 'x = [-b ± √(b² - 4ac)] / 2a', desc: 'To find roots of ax² + bx + c = 0', sub: 'Maths' },
    { name: 'Slope of a Line', eq: 'm = (y₂ - y₁) / (x₂ - x₁)', desc: 'Rate of change between two coordinates', sub: 'Maths' },
    { name: 'Mole Calculation', eq: 'Moles = Mass / Molar Mass', desc: 'Chemical quantity computation', sub: 'Chemistry' },
    { name: 'pH Value', eq: 'pH = -log[H⁺]', desc: 'Acidity or basicity scale', sub: 'Chemistry' },
    { name: 'Density Formula', eq: 'ρ = m / V', desc: 'Density = Mass / Volume', sub: 'Physics' },
    { name: 'Charles\'s Law', eq: 'V₁ / T₁ = V₂ / T₂', desc: 'Gas volume and temperature proportionality', sub: 'Chemistry' }
  ];

  // Handle Speech synthesis
  const startSpeech = () => {
    if (!notesText) {
      alert("No notes text available to read out. Please view a topic's notes panel.");
      return;
    }
    window.speechSynthesis.cancel();
    // Clean markdown characters for pleasant hearing
    const plainText = notesText
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]/g, '')
      .slice(0, 1500); // limit to prevent long lockups

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = speechRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Calculator logic
  const handleCalcBtn = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '=') {
      try {
        // Safe evaluation pattern
        const sanitized = calcInput
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/π/g, '3.14159')
          .replace(/√\(/g, 'Math.sqrt(');
        
        // Count open brackets and balance them
        const openBrackets = (sanitized.match(/\(/g) || []).length;
        const closeBrackets = (sanitized.match(/\)/g) || []).length;
        let balanced = sanitized;
        if (openBrackets > closeBrackets) {
          balanced += ')'.repeat(openBrackets - closeBrackets);
        }

        const res = new Function(`return ${balanced}`)();
        setCalcResult(String(res));
      } catch (e) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const filteredVocab = vocabulary.filter(item => 
    item.eng.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.ur.includes(searchQuery) ||
    item.cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Action Button - 100% 3-Color Styled */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-6 bg-[#facc15] hover:bg-[#eab308] text-[#00175c] border-4 border-[#00175c] p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 flex items-center gap-2 font-black text-xs uppercase tracking-wider animate-bounce"
        style={{ animationDuration: '3s' }}
        id="easy-assistant-fab"
        title="Student Easy Guide & Tools"
      >
        <Sparkles size={18} className="animate-pulse" fill="currentColor" />
        <span className="hidden md:inline">Easy Assistant (طالبِ علم آسانی)</span>
      </button>

      {/* Slide-Up Overlay Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#00175c]/60 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4 z-55 animate-fade-in"
          id="easy-assistant-overlay"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white border-t-4 md:border-4 border-[#00175c] w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh] animate-slide-up"
            id="easy-assistant-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#00175c] text-white p-4 flex justify-between items-center border-b-2 border-[#00175c]">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#facc15]" fill="currentColor" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">Student Easy Assistant</h3>
                  <p className="text-[10px] text-white/75 font-semibold uppercase">Quick Tools for Faster Board Preparation</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl border-2 border-white/20 hover:bg-white/10 text-white cursor-pointer transition-all"
                id="close-assistant-btn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Navigation Tabs inside Assistant */}
            <div className="bg-[#00175c]/5 border-b border-[#00175c]/10 grid grid-cols-4 text-center text-[10px] font-black uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('dictionary')}
                className={`py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === 'dictionary' ? 'bg-white text-[#00175c] border-b-4 border-[#facc15]' : 'text-[#00175c]/60 hover:bg-[#00175c]/5'
                }`}
              >
                <BookOpen size={14} />
                <span>Dictionary</span>
              </button>
              <button
                onClick={() => setActiveTab('calculator')}
                className={`py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === 'calculator' ? 'bg-white text-[#00175c] border-b-4 border-[#facc15]' : 'text-[#00175c]/60 hover:bg-[#00175c]/5'
                }`}
              >
                <Calculator size={14} />
                <span>Calculator</span>
              </button>
              <button
                onClick={() => setActiveTab('formulas')}
                className={`py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === 'formulas' ? 'bg-white text-[#00175c] border-b-4 border-[#facc15]' : 'text-[#00175c]/60 hover:bg-[#00175c]/5'
                }`}
              >
                <Sparkles size={14} />
                <span>Formulas</span>
              </button>
              <button
                onClick={() => setActiveTab('speech')}
                className={`py-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  activeTab === 'speech' ? 'bg-white text-[#00175c] border-b-4 border-[#facc15]' : 'text-[#00175c]/60 hover:bg-[#00175c]/5'
                }`}
              >
                <Volume2 size={14} />
                <span>Audio Read</span>
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4" id="assistant-body-content">
              
              {/* TAB 1: BILINGUAL DICTIONARY */}
              {activeTab === 'dictionary' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-[11px] text-[#00175c]/75 font-semibold uppercase leading-normal">
                    🔍 Translate difficult scientific terminology to Urdu instantly:
                  </p>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-[#00175c]/40" size={16} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search English or Urdu terms..."
                      className="w-full pl-9 pr-4 py-2 border-2 border-[#00175c]/20 focus:border-[#00175c] rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {filteredVocab.length > 0 ? (
                      filteredVocab.map((vocab, index) => (
                        <div key={index} className="p-3 border-2 border-[#00175c]/10 hover:border-[#00175c] bg-[#00175c]/5 rounded-xl flex justify-between items-center transition-all">
                          <div>
                            <span className="text-xs font-black text-[#00175c]">{vocab.eng}</span>
                            <span className="ml-2 text-[9px] bg-[#00175c]/10 text-[#00175c]/70 font-black uppercase px-1.5 py-0.5 rounded">
                              {vocab.cat}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-right text-[#00175c]" dir="rtl">
                            {vocab.ur}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-center py-6 font-semibold text-[#00175c]/40">No matching educational terms found.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE MCQS SOLVER CALCULATOR */}
              {activeTab === 'calculator' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-[11px] text-[#00175c]/75 font-semibold uppercase leading-normal">
                    🧮 Use this fast, simplified calculator to verify numerical values during board mock quizzes:
                  </p>

                  <div className="border-4 border-[#00175c] bg-white rounded-2xl p-4 space-y-2 shadow-inner">
                    <div className="text-right py-1">
                      <div className="text-xs text-[#00175c]/50 font-mono tracking-wider h-5">{calcInput || '0'}</div>
                      <div className="text-xl font-black text-[#00175c] font-mono h-8 overflow-x-auto">{calcResult || '0'}</div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {/* Special scientific helper row */}
                      {['√(', 'π', '(', ')'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcBtn(btn)}
                          className="py-2 rounded-xl bg-[#00175c]/10 text-[#00175c] text-xs font-black cursor-pointer hover:bg-[#00175c]/25 transition-all"
                        >
                          {btn}
                        </button>
                      ))}

                      {/* Numbers & Operators */}
                      {['7', '8', '9', '÷'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcBtn(btn === '÷' ? '/' : btn)}
                          className="py-3 rounded-xl bg-slate-100 text-[#00175c] text-xs font-black cursor-pointer hover:bg-slate-200 transition-all"
                        >
                          {btn}
                        </button>
                      ))}

                      {['4', '5', '6', '×'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcBtn(btn === '×' ? '*' : btn)}
                          className="py-3 rounded-xl bg-slate-100 text-[#00175c] text-xs font-black cursor-pointer hover:bg-slate-200 transition-all"
                        >
                          {btn}
                        </button>
                      ))}

                      {['1', '2', '3', '-'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcBtn(btn)}
                          className="py-3 rounded-xl bg-slate-100 text-[#00175c] text-xs font-black cursor-pointer hover:bg-slate-200 transition-all"
                        >
                          {btn}
                        </button>
                      ))}

                      {['C', '0', '=', '+'].map((btn) => (
                        <button
                          key={btn}
                          onClick={() => handleCalcBtn(btn)}
                          className={`py-3 rounded-xl text-xs font-black cursor-pointer transition-all ${
                            btn === '=' 
                              ? 'bg-[#facc15] text-[#00175c] hover:bg-[#eab308]' 
                              : btn === 'C'
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-slate-100 text-[#00175c] hover:bg-slate-200'
                          }`}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: KEY FORMULAS SHEET */}
              {activeTab === 'formulas' && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-[11px] text-[#00175c]/75 font-semibold uppercase leading-normal">
                    📚 Quick revision sheet of essential chemical, math & physical formulas:
                  </p>

                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {formulas.map((f, i) => (
                      <div key={i} className="p-3 border-2 border-[#00175c] bg-white rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-[#00175c]/60">{f.sub}</span>
                          <span className="text-[11px] font-black text-[#00175c]">{f.name}</span>
                        </div>
                        <div className="bg-[#00175c]/5 p-2 rounded-lg font-mono text-xs text-[#00175c] font-bold text-center border border-[#00175c]/10">
                          {f.eq}
                        </div>
                        <p className="text-[9px] text-[#00175c]/70 font-semibold italic">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIO NOTES SPEAKER */}
              {activeTab === 'speech' && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-[11px] text-[#00175c]/75 font-semibold uppercase leading-normal">
                    🔊 Text-to-Speech Syllabus Notes Assistant:
                  </p>

                  <div className="bg-[#00175c]/5 border-2 border-[#00175c]/10 p-4 rounded-2xl text-center space-y-4">
                    <div className="flex justify-center">
                      {isSpeaking ? (
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-[#facc15]/30 animate-ping" />
                          <button 
                            onClick={stopSpeech}
                            className="relative w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white border-4 border-[#00175c] flex items-center justify-center cursor-pointer transition-all"
                          >
                            <VolumeX size={24} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={startSpeech}
                          className="w-16 h-16 rounded-full bg-[#facc15] hover:bg-[#eab308] text-[#00175c] border-4 border-[#00175c] flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95"
                        >
                          <Volume2 size={24} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase text-[#00175c]">
                        {isSpeaking ? 'Now Playing Study Notes...' : 'Click to Listen to Syllabus Notes'}
                      </h4>
                      <p className="text-[10px] text-[#00175c]/70 font-semibold leading-relaxed">
                        Our audio reading system will speak out the currently active chapter notes directly to help you study hands-free.
                      </p>
                    </div>

                    {/* Speed rate selector */}
                    <div className="space-y-1 text-left pt-2 border-t border-[#00175c]/10">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>Speech Rate (Speed)</span>
                        <span>{speechRate}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.75"
                        max="1.5"
                        step="0.25"
                        value={speechRate}
                        onChange={(e) => {
                          setSpeechRate(Number(e.target.value));
                          if (isSpeaking) {
                            startSpeech(); // restart with new speed
                          }
                        }}
                        className="w-full accent-[#00175c]"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="bg-slate-100 p-3 text-center border-t border-[#00175c]/10 text-[9px] font-black uppercase tracking-widest text-[#00175c]/50">
              The Ali's Collegiate Board Exams Success Suite ✓
            </div>

          </div>
        </div>
      )}
    </>
  );
}
