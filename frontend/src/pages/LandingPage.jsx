import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    ChevronDown,
    ChevronRight,
    Home,
    BookOpen,
    UserRound,
    LogOut,
} from 'lucide-react';

const LandingPage = () => {
    const [promptText, setPromptText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Check auth status
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token) {
            setIsLoggedIn(true);
            try {
                setUser(JSON.parse(storedUser || '{}'));
            } catch (e) {
                setUser(null);
            }
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Speech recognition setup for Voice & Board button
    const toggleSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice recording is supported in Chrome, Edge, and Safari browsers.');
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsRecording(true);
            };

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setPromptText(transcript);
            };

            recognition.onerror = (err) => {
                console.error('Speech recognition error:', err);
                setIsRecording(false);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Speech initialization error:', err);
            setIsRecording(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        setDropdownOpen(false);
        const heroEl = document.getElementById('hero');
        if (heroEl) {
            heroEl.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        const activePrompt = promptText.trim();
        if (!activePrompt && !selectedFile) {
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        }

        setIsAnalyzing(true);
        setAnalysisStep(0);

        // Step text ticker (quick & responsive)
        const timer1 = setTimeout(() => setAnalysisStep(1), 350);
        const timer2 = setTimeout(() => setAnalysisStep(2), 700);

        try {
            const formData = new FormData();
            if (activePrompt) formData.append('notes', activePrompt);
            if (selectedFile) formData.append('file', selectedFile);

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
            const response = await fetch(`${apiBase}/classes/create-from-document`, {
                method: 'POST',
                headers,
                body: formData,
            });

            let classId = null;
            let targetTopic = activePrompt || selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Custom Class';

            if (response.ok) {
                const resJson = await response.json();
                const classData = resJson.class;
                targetTopic = resJson.first_topic || resJson.course_title || targetTopic;
                classId = resJson.class_id;

                localStorage.removeItem('tutorflow_cached_curriculum');
                sessionStorage.setItem('classroom_topic', targetTopic);
                if (classId) sessionStorage.setItem('classroom_class_id', classId);
                if (classData) sessionStorage.setItem('custom_curriculum', JSON.stringify(classData.curriculum || classData));
            } else {
                sessionStorage.setItem('classroom_topic', targetTopic);
            }
        } catch (error) {
            console.warn('Backend class creation completed with local fallback:', error);
            const defaultTopic = activePrompt || selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Mathematics';
            sessionStorage.setItem('classroom_topic', defaultTopic);
        } finally {
            clearTimeout(timer1);
            clearTimeout(timer2);
            setAnalysisStep(3);

            setTimeout(() => {
                setIsAnalyzing(false);
                const topicToOpen = sessionStorage.getItem('classroom_topic') || '';
                const classIdToOpen = sessionStorage.getItem('classroom_class_id') || '';
                const classroomUrl = `/classroom${topicToOpen ? `?topic=${encodeURIComponent(topicToOpen)}${classIdToOpen ? `&class_id=${encodeURIComponent(classIdToOpen)}` : ''}` : ''}`;

                if (isLoggedIn) {
                    navigate(classroomUrl);
                } else {
                    sessionStorage.setItem('pending_prompt', activePrompt);
                    sessionStorage.setItem('redirect_to', classroomUrl);
                    navigate('/signup');
                }
            }, 300);
        }
    };

    const userInitial = (user?.full_name || user?.email || 'T')[0].toUpperCase();

    return (
        <>
            <style>
                {`
                    @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap");
                    * {
                        font-family: "Poppins", sans-serif;
                    }
                    h1 {
                        font-family: "Outfit", sans-serif;
                        letter-spacing: -0.025em;
                    }
                `}
            </style>

            <section className='w-full min-h-screen bg-white px-4 pb-20 relative'>
                {/* Navigation Bar */}
                <nav className='flex items-center justify-between w-full md:px-16 lg:px-24 xl:px-32 py-5'>
                    {/* Official TutorFlow Logo */}
                    <Link to='/' className='flex items-center gap-2' aria-label='TutorFlow'>
                        <img 
                            src="/Logo_cropped.png" 
                            alt="TutorFlow" 
                            className="h-12 w-auto object-contain"
                            onError={(e) => { e.currentTarget.src = "Logo_cropped.png"; }}
                        />
                    </Link>

                    {/* Right side: Login & Get Started OR User Profile Avatar Dropdown */}
                    {!isLoggedIn ? (
                        <div className='flex items-center gap-3'>
                            <Link to='/login' className='text-sm font-medium text-neutral-700 hover:text-neutral-900 px-3 py-2 transition-colors'>
                                Login
                            </Link>
                            <button 
                                onClick={() => navigate('/signup')} 
                                className='px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 rounded-full text-white text-sm font-medium transition-all cursor-pointer'
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className='relative' ref={dropdownRef}>
                            {/* Trigger Button: White pill with black circle avatar + chevron down */}
                            <button 
                                type="button"
                                onClick={() => setDropdownOpen(!dropdownOpen)} 
                                className='flex items-center gap-2.5 p-1 pl-1 pr-3 rounded-full border border-neutral-200 hover:border-neutral-300 bg-white transition-colors cursor-pointer'
                                aria-expanded={dropdownOpen}
                                aria-label="User menu"
                            >
                                <div className='size-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs'>
                                    {userInitial}
                                </div>
                                <ChevronDown size={14} strokeWidth={2.5} className='text-neutral-800' />
                            </button>

                            {/* Dropdown Menu Card */}
                            {dropdownOpen && (
                                <div className='absolute right-0 mt-2.5 w-[250px] bg-white border border-[#e5e7eb] rounded-xl shadow-none py-0 z-50 animate-in fade-in duration-150 overflow-hidden'>
                                    {/* Upward caret triangle pointing to trigger */}
                                    <div className='absolute -top-1.5 right-5 w-3 h-3 bg-white border-t border-l border-[#e5e7eb] rotate-45'></div>

                                    {/* Header: Avatar + Name + Email */}
                                    <div className='px-4 py-3 flex items-center gap-3'>
                                        <div className='size-9 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-sm shrink-0'>
                                            {userInitial}
                                        </div>
                                        <div className='min-w-0 flex-1'>
                                            <h4 className='text-[13.5px] font-semibold text-neutral-900 leading-tight truncate' style={{ fontFamily: '"Outfit", sans-serif' }}>
                                                {user?.full_name || 'MANZI SHIMWA Yves seraphin'}
                                            </h4>
                                            <p className='text-[11.5px] text-neutral-500 font-normal truncate mt-0.5'>
                                                {user?.email || 'myvesseraphin@gmail.com'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Options List with dividing lines and NO shadows */}
                                    <div className='border-t border-[#f0f0f0]'>
                                        {/* Dashboard */}
                                        <Link 
                                            to='/dashboard' 
                                            onClick={() => setDropdownOpen(false)}
                                            className='flex items-center px-4 py-2.5 hover:bg-neutral-50/80 transition-colors border-b border-[#f0f0f0]'
                                        >
                                            <Home size={16} strokeWidth={2} className='text-neutral-900 shrink-0 mr-3' />
                                            <span className='text-[13px] font-medium text-neutral-900'>Dashboard</span>
                                            <ChevronRight size={14} strokeWidth={2} className='text-neutral-400 ml-auto' />
                                        </Link>

                                        {/* AI Classroom */}
                                        <Link 
                                            to='/classroom' 
                                            onClick={() => setDropdownOpen(false)}
                                            className='flex items-center px-4 py-2.5 hover:bg-neutral-50/80 transition-colors border-b border-[#f0f0f0]'
                                        >
                                            <BookOpen size={16} strokeWidth={2} className='text-neutral-900 shrink-0 mr-3' />
                                            <span className='text-[13px] font-medium text-neutral-900'>AI Classroom</span>
                                            <ChevronRight size={14} strokeWidth={2} className='text-neutral-400 ml-auto' />
                                        </Link>

                                        {/* Profile */}
                                        <Link 
                                            to='/profile' 
                                            onClick={() => setDropdownOpen(false)}
                                            className='flex items-center px-4 py-2.5 hover:bg-neutral-50/80 transition-colors border-b border-[#f0f0f0]'
                                        >
                                            <UserRound size={16} strokeWidth={2} className='text-neutral-900 shrink-0 mr-3' />
                                            <span className='text-[13px] font-medium text-neutral-900'>Profile</span>
                                            <ChevronRight size={14} strokeWidth={2} className='text-neutral-400 ml-auto' />
                                        </Link>

                                        {/* Logout */}
                                        <button 
                                            type="button"
                                            onClick={handleLogout}
                                            className='flex items-center px-4 py-2.5 hover:bg-red-50/50 transition-colors w-full text-left cursor-pointer'
                                        >
                                            <LogOut size={16} strokeWidth={2} className='text-red-500 shrink-0 mr-3' />
                                            <span className='text-[13px] font-medium text-red-500'>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </nav>

                <div id='hero' className='flex flex-col items-center justify-between mt-32'>
                    <h1 className='text-neutral-900 text-4xl md:text-6xl font-semibold max-w-4xl text-center leading-tight tracking-tight'>
                        Transform any lesson into your personal AI class.
                    </h1>

                    <div className='mt-10 w-full flex flex-col items-center justify-center'>
                        <form onSubmit={handleSubmit} className='bg-[#262626] rounded-2xl p-4 sm:p-6 w-full max-w-[590px] border border-neutral-800'>
                            <textarea 
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                className='w-full bg-transparent text-neutral-200 placeholder:text-neutral-400 text-sm mb-6 outline-none resize-none border-none' 
                                placeholder={isRecording ? 'Listening to your voice...' : 'Upload notes, syllabus, or type what you want to learn..'} 
                                rows='2' 
                            />

                            {/* Selected File Badge */}
                            {selectedFile && (
                                <div className='mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-xs'>
                                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='text-blue-400'>
                                        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
                                        <polyline points='14 2 14 8 20 8'></polyline>
                                    </svg>
                                    <span className='truncate max-w-[200px] font-medium'>{selectedFile.name}</span>
                                    <button 
                                        type='button' 
                                        onClick={() => setSelectedFile(null)} 
                                        className='ml-1 text-neutral-400 hover:text-white cursor-pointer font-bold'
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input 
                                type='file' 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept='.pdf,.png,.jpg,.jpeg,.txt,.doc,.docx' 
                                className='hidden' 
                            />

                            <div className='flex flex-wrap items-center gap-2.5 pt-2'>
                                {/* Plus Icon to Upload Files */}
                                <button 
                                    type='button'
                                    onClick={() => fileInputRef.current?.click()}
                                    className='flex items-center gap-2 px-4 py-2 border border-neutral-700 hover:border-neutral-500 rounded-full transition-colors bg-transparent hover:bg-neutral-700 cursor-pointer active:scale-95'
                                    title='Upload file'
                                >
                                    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' className='text-neutral-300'>
                                        <line x1='12' y1='5' x2='12' y2='19'></line>
                                        <line x1='5' y1='12' x2='19' y2='12'></line>
                                    </svg>
                                    <span className='text-neutral-300 text-xs font-medium'>
                                        Upload file
                                    </span>
                                </button>

                                {/* Voice & Board Button: Speech-to-Text */}
                                <button 
                                    type='button'
                                    onClick={toggleSpeechRecognition}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer active:scale-95 ${
                                        isRecording 
                                            ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse' 
                                            : 'bg-transparent hover:bg-neutral-700 border-neutral-700 text-neutral-300'
                                    }`}
                                    title={isRecording ? 'Click to stop recording' : 'Click to speak your prompt'}
                                >
                                    {isRecording ? (
                                        <span className='size-2 rounded-full bg-red-500 animate-ping'></span>
                                    ) : (
                                        <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                                            <path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'></path>
                                            <path d='M19 10v2a7 7 0 0 1-14 0v-2'></path>
                                        </svg>
                                    )}
                                    <span className='text-xs font-medium'>
                                        {isRecording ? 'Listening...' : 'Voice & Board'}
                                    </span>
                                </button>

                                {/* Gemini AI Badge */}
                                <div className='flex items-center gap-2 px-2 py-2 bg-transparent rounded-full'>
                                    <svg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
                                        <path d='M12.484 6.257a9 9 0 0 1-2.832-1.91A9 9 0 0 1 7.312.241a.32.32 0 0 0-.621 0 9 9 0 0 1-2.342 4.106A9 9 0 0 1 .243 6.69a.32.32 0 0 0 0 .62q.654.165 1.274.431A9 9 0 0 1 4.35 9.65a9 9 0 0 1 2.342 4.107.32.32 0 0 0 .62 0q.165-.653.431-1.275a9 9 0 0 1 1.91-2.832 9 9 0 0 1 4.107-2.34.32.32 0 0 0 0-.621 8.4 8.4 0 0 1-1.275-.432' fill='#3186ff' />
                                        <path d='M12.484 6.257a9 9 0 0 1-2.832-1.91A9 9 0 0 1 7.312.241a.32.32 0 0 0-.621 0 9 9 0 0 1-2.342 4.106A9 9 0 0 1 .243 6.69a.32.32 0 0 0 0 .62q.654.165 1.274.431A9 9 0 0 1 4.35 9.65a9 9 0 0 1 2.342 4.107.32.32 0 0 0 .62 0q.165-.653.431-1.275a9 9 0 0 1 1.91-2.832 9 9 0 0 1 4.107-2.34.32.32 0 0 0 0-.621 8.4 8.4 0 0 1-1.275-.432' fill='url(#a)' />
                                        <path d='M12.484 6.257a9 9 0 0 1-2.832-1.91A9 9 0 0 1 7.312.241a.32.32 0 0 0-.621 0 9 9 0 0 1-2.342 4.106A9 9 0 0 1 .243 6.69a.32.32 0 0 0 0 .62q.654.165 1.274.431A9 9 0 0 1 4.35 9.65a9 9 0 0 1 2.342 4.107.32.32 0 0 0 .62 0q.165-.653.431-1.275a9 9 0 0 1 1.91-2.832 9 9 0 0 1 4.107-2.34.32.32 0 0 0 0-.621 8.4 8.4 0 0 1-1.275-.432' fill='url(#b)' />
                                        <path d='M12.484 6.257a9 9 0 0 1-2.832-1.91A9 9 0 0 1 7.312.241a.32.32 0 0 0-.621 0 9 9 0 0 1-2.342 4.106A9 9 0 0 1 .243 6.69a.32.32 0 0 0 0 .62q.654.165 1.274.431A9 9 0 0 1 4.35 9.65a9 9 0 0 1 2.342 4.107.32.32 0 0 0 .62 0q.165-.653.431-1.275a9 9 0 0 1 1.91-2.832 9 9 0 0 1 4.107-2.34.32.32 0 0 0 0-.621 8.4 8.4 0 0 1-1.275-.432' fill='url(#c)' />
                                        <defs>
                                            <linearGradient id='a' x1='3.819' y1='9.226' x2='6.364' y2='6.999' gradientUnits='userSpaceOnUse'><stop stopColor='#08b962' /><stop offset='1' stopColor='#08b962' stopOpacity='0' /></linearGradient>
                                            <linearGradient id='b' x1='4.455' y1='2.862' x2='6.682' y2='6.362' gradientUnits='userSpaceOnUse'><stop stopColor='#f94543' /><stop offset='1' stopColor='#f94543' stopOpacity='0' /></linearGradient>
                                            <linearGradient id='c' x1='1.591' y1='7.953' x2='10.501' y2='6.999' gradientUnits='userSpaceOnUse'><stop stopColor='#fabc12' /><stop offset='.46' stopColor='#fabc12' stopOpacity='0' /></linearGradient>
                                        </defs>
                                    </svg>
                                    <span className='text-neutral-300 text-xs'>Gemini Live</span>
                                </div>

                                {/* Submit Arrow Button */}
                                <button 
                                    type='submit'
                                    className='ml-auto flex items-center justify-center w-9 h-9 rounded-full transition-colors border border-neutral-700 hover:border-neutral-500 bg-white/5 hover:bg-white/10 cursor-pointer active:scale-95'
                                    title='Start Class'
                                >
                                    <svg width='7' height='8' viewBox='0 0 7 8' fill='none' xmlns='http://www.w3.org/2000/svg'>
                                        <path d='M0 1A1 1 0 0 1 1.5.136l4.848 2.799a1 1 0 0 1 0 1.732L1.5 7.465A1 1 0 0 1 0 6.599z' fill='#ffffff' />
                                    </svg>
                                </button>
                            </div>
                        </form>

                        {/* Subject Chips */}
                        <div className='flex flex-wrap items-center justify-center gap-4 mt-8'>
                            <button 
                                type='button'
                                onClick={() => setPromptText('Calculus: Derivatives & Integrals')}
                                className='px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-slate-50 rounded-full transition-colors text-xs cursor-pointer active:scale-95'
                            >
                                Calculus
                            </button>
                            <button 
                                type='button'
                                onClick={() => setPromptText("Physics: Newton's Laws & Mechanics")}
                                className='px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-slate-50 rounded-full transition-colors text-xs cursor-pointer active:scale-95'
                            >
                                Physics
                            </button>
                            <button 
                                type='button'
                                onClick={() => setPromptText('Linear Algebra: Matrix operations & Eigenvectors')}
                                className='px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-slate-50 rounded-full transition-colors text-xs cursor-pointer active:scale-95'
                            >
                                Linear Algebra
                            </button>
                        </div>
                    </div>
                </div>

                {/* AI Analysis Modal Overlay: Starting your classroom */}
                {isAnalyzing && (
                    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 animate-in fade-in duration-200'>
                        <div className='bg-white rounded-2xl p-8 sm:p-10 max-w-md w-full border border-neutral-200 flex flex-col items-center text-center'>
                            {/* Animated Pulse & Spinner in clean black */}
                            <div className='relative size-16 mb-6 flex items-center justify-center'>
                                <div className='absolute inset-0 rounded-full bg-neutral-200 animate-ping opacity-75'></div>
                                <div className='relative size-14 rounded-full bg-[#111111] flex items-center justify-center text-white'>
                                    <svg className='animate-spin size-6 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                    </svg>
                                </div>
                            </div>

                            <h3 className='text-2xl font-bold text-neutral-900 tracking-tight mb-2' style={{ fontFamily: '"Outfit", sans-serif' }}>
                                Starting your classroom...
                            </h3>

                            <p className='text-sm text-neutral-600 mb-6 transition-all duration-300 min-h-[40px] flex items-center justify-center'>
                                {analysisStep === 0 && 'Reading your study materials & notes...'}
                                {analysisStep === 1 && 'Preparing your lesson concepts...'}
                                {analysisStep === 2 && 'Setting up your interactive whiteboard...'}
                                {analysisStep === 3 && 'Classroom ready! Opening your session...'}
                            </p>

                            {/* Progress bar dots in clean black */}
                            <div className='flex items-center gap-2'>
                                <div className={`size-2 rounded-full transition-all duration-300 ${analysisStep >= 0 ? 'bg-[#111111] scale-110' : 'bg-neutral-200'}`}></div>
                                <div className={`size-2 rounded-full transition-all duration-300 ${analysisStep >= 1 ? 'bg-[#111111] scale-110' : 'bg-neutral-200'}`}></div>
                                <div className={`size-2 rounded-full transition-all duration-300 ${analysisStep >= 2 ? 'bg-[#111111] scale-110' : 'bg-neutral-200'}`}></div>
                                <div className={`size-2 rounded-full transition-all duration-300 ${analysisStep >= 3 ? 'bg-[#111111] scale-110' : 'bg-neutral-200'}`}></div>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
};

export default LandingPage;
