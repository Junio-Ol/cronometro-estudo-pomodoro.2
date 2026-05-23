import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  CheckSquare, 
  History, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Trash2, 
  Plus, 
  Volume2, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Calendar,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { Task, FocusLog, AppConfig, Quote } from './types';
import { ambientAudio } from './ambientAudio';
import { AudioVisualizer } from './components/AudioVisualizer';

// Motivational quotes in Portuguese
const quotes: Quote[] = [
  { text: "A educação é a arma mais poderosa para mudar o mundo.", author: "Nelson Mandela" },
  { text: "Disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
  { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
  { text: "Não pare até se orgulhar.", author: "Anônimo" },
  { text: "Foco é dizer não para cem outras boas ideias.", author: "Steve Jobs" },
  { text: "A paciência e a persistência têm um efeito mágico ante o qual as dificuldades somem.", author: "John Quincy Adams" },
  { text: "Seja comum. Seja simples. Seja você mesmo. Ria das suas falhas e persista.", author: "Socrates" },
  { text: "Obstáculos são aquelas coisas assustadoras que você vê quando desvia os olhos do seu objetivo.", author: "Henry Ford" },
  { text: "Sua mente é um instrumento excelente se usada corretamente.", author: "Eckhart Tolle" }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dash' | 'tasks' | 'logs' | 'config' | 'privacy'>('dash');

  // Load configuration from localStorage
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('rf_pro_v1');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.cfg) {
          // Backward compatibility check
          const parsed = p.cfg;
          return {
            focus: parsed.focus || 25,
            goal: parsed.goal || 4,
            focusMode: parsed.focusMode || 'pomodoro'
          };
        }
      } catch (e) {}
    }
    return { focus: 25, goal: 4, focusMode: 'pomodoro' };
  });

  // Load or initialize static tasks list with localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('rf_pro_v1');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.tasks) return p.tasks;
      } catch (e) {}
    }
    return [
      { id: 1, text: "Focar em alta performance de código ⚡", done: false },
      { id: 2, text: "Configurar mixer de áudio ambiente de chuva 🌧", done: true }
    ];
  });

  // Load completed focus sessions logs
  const [logs, setLogs] = useState<FocusLog[]>(() => {
    const saved = localStorage.getItem('rf_pro_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Timer run parameters
  const [running, setRunning] = useState<boolean>(false);
  const [secs, setSecs] = useState<number>(() => {
    return config.focusMode === 'pomodoro' ? config.focus * 60 : 0;
  });

  // Keep track of starting parameters for dynamic percentage calculations
  const [initialPomodoroSecs, setInitialPomodoroSecs] = useState<number>(() => {
    return config.focus * 60;
  });

  // Ambient synth volume nodes state (0 to 100)
  const [volumeRain, setVolumeRain] = useState<number>(0);
  const [volumeForest, setVolumeForest] = useState<number>(0);
  const [volumeWhite, setVolumeWhite] = useState<number>(0);

  // Quote rotation control
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [quoteFade, setQuoteFade] = useState<boolean>(true);

  // General current date system info string
  const [currentDateString, setCurrentDateString] = useState<string>('');
  
  // Custom alerts triggers
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Fullscreen container ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Time reference holders
  const intervalRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecsRef = useRef<number>(0);

  // Set formatted current day string inside Portuguese localized template
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateString(now.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'short',
        weekday: 'short'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Sync Task changes & configuration rules back to local files
  useEffect(() => {
    localStorage.setItem('rf_pro_v1', JSON.stringify({ cfg: config, tasks }));
  }, [config, tasks]);

  // Handle active countdown / stopwatch ticks
  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now();
      // Keep track of where we started tracking this interval
      const startingSecs = secs;
      
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current !== null) {
          const deltaSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
          
          if (config.focusMode === 'pomodoro') {
            const nextSecs = startingSecs - deltaSecs;
            if (nextSecs <= 0) {
              setSecs(0);
              setRunning(false);
              clearInterval(intervalRef.current);
              
              // Completed a full Pomodoro! auto-save to focal logs
              saveSession(config.focus * 60);
              triggerAlert("Pomodoro finalizado! Excelente trabalho! 🎉", "success");
              // Play a light synth sound using browser oscillator if possible
              playFinishChime();
            } else {
              setSecs(nextSecs);
            }
          } else {
            // Free stopwatch counts up
            setSecs(startingSecs + deltaSecs);
          }
        }
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, config.focusMode]);

  // Dynamic Browser Tab title tracker
  useEffect(() => {
    const timerStr = formatMinutesSeconds(secs);
    const indicatorEmoji = running ? '⏱️' : '⏸️';
    document.title = `[${timerStr}] ${indicatorEmoji} Relógio Foco`;
  }, [secs, running]);

  // Adjust remaining timer counters immediately when configuration parameters change
  useEffect(() => {
    if (!running) {
      if (config.focusMode === 'pomodoro') {
        setSecs(config.focus * 60);
        setInitialPomodoroSecs(config.focus * 60);
      } else {
        setSecs(0);
      }
    }
  }, [config.focus, config.focusMode, running]);

  // Quote carousel auto-changer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setQuoteFade(true);
      }, 500);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Global keydown listeners for convenient rapid usage (Space: start/stop timer)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is active in typing inputs
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running, secs]);

  // Soft custom oscillator melody to celebrate focus session end
  const playFinishChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0.15, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch (e) {
      console.warn("Audio chime unsupported:", e);
    }
  };

  const triggerAlert = (text: string, type: 'success' | 'info') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Sound mixer manual triggers (linked to client-side audio engine)
  const handleVolumeChange = (type: 'rain' | 'forest' | 'white', vol: number) => {
    if (type === 'rain') {
      setVolumeRain(vol);
      ambientAudio.updateRain(vol);
    } else if (type === 'forest') {
      setVolumeForest(vol);
      ambientAudio.updateForest(vol);
    } else if (type === 'white') {
      setVolumeWhite(vol);
      ambientAudio.updateWhite(vol);
    }
  };

  // Timer Handlers
  const toggleTimer = () => {
    setRunning(!running);
  };

  const resetTimer = () => {
    setRunning(false);
    if (config.focusMode === 'pomodoro') {
      setSecs(config.focus * 60);
    } else {
      setSecs(0);
    }
  };

  // Finish session and record logged minutes
  const handleFinishAndSave = () => {
    let elapsedSeconds = 0;
    if (config.focusMode === 'pomodoro') {
      elapsedSeconds = Math.max(0, (config.focus * 60) - secs);
    } else {
      elapsedSeconds = secs;
    }

    if (elapsedSeconds < 5) {
      triggerAlert("Sessão muito curta para ser registrada! Cubra pelo menos 5 segundos de foco.", "info");
      return;
    }

    saveSession(elapsedSeconds);
    resetTimer();
  };

  const saveSession = (elapsedSecs: number) => {
    const rightNow = new Date();
    const newLog: FocusLog = {
      date: rightNow.toDateString(),
      dur: elapsedSecs,
      time: rightNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('rf_pro_logs', JSON.stringify(updatedLogs));
    
    const minutesString = (elapsedSecs / 60).toFixed(1);
    triggerAlert(`Sessão de foco salva! +${minutesString} minutos registrados com sucesso.`, "success");
  };

  const handleClearHistory = () => {
    if (window.confirm("Você realmente deseja limpar todo o seu histórico de hoje?")) {
      setLogs([]);
      localStorage.setItem('rf_pro_logs', JSON.stringify([]));
      triggerAlert("Histórico de foco redefinido.", "info");
    }
  };

  // Helper date duration formatter
  const formatMinutesSeconds = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Calculate percentage of target focus hours accomplished TODAY
  const calculateDailyProgress = () => {
    const todayStr = new Date().toDateString();
    const totalTodaySecs = logs
      .filter(l => l.date === todayStr)
      .reduce((acc, curr) => acc + curr.dur, 0);
    
    const totalTodayHours = totalTodaySecs / 3600;
    const percentage = Math.min(100, Math.round((totalTodayHours / config.goal) * 100));
    return {
      hours: totalTodayHours.toFixed(2),
      percent: percentage
    };
  };

  // Screen Fullscreen controller
  const toggleContainerFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch((err) => {
        console.warn("Fullscreen request rejected:", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Watch for external escape-key fullscreen updates
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Simple quick task operations
  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('taskText') as HTMLInputElement);
    const value = input.value.trim();
    if (!value) return;

    const newTask: Task = {
      id: Date.now(),
      text: value,
      done: false
    };

    setTasks([...tasks, newTask]);
    input.value = '';
    triggerAlert("Tarefa adicionada!", "success");
  };

  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Simple config options save
  const handleSavePreferences = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const focusVal = parseInt((e.currentTarget.elements.namedItem('focusTime') as HTMLInputElement).value) || 25;
    const goalVal = parseFloat((e.currentTarget.elements.namedItem('goalTime') as HTMLInputElement).value) || 4;
    const modeVal = (e.currentTarget.elements.namedItem('focusModeOpt') as HTMLSelectElement).value as 'free' | 'pomodoro';

    setConfig({
      focus: focusVal,
      goal: goalVal,
      focusMode: modeVal
    });

    triggerAlert("Configurações salvas e aplicadas!", "success");
    setActiveTab('dash');
  };

  const dailyStats = calculateDailyProgress();

  // Dynamic progress loader logic for nice visual countdown display in Pomodoro
  const calculatePomodoroPercentage = () => {
    if (config.focusMode !== 'pomodoro') return 100;
    return Math.max(0, Math.min(100, (secs / initialPomodoroSecs) * 100));
  };

  const pPercent = calculatePomodoroPercentage();

  return (
    <div 
      id="focus-app-root"
      ref={containerRef}
      className={`app-wrapper flex flex-col justify-start w-full min-h-screen max-w-[500px] mx-auto px-4 py-8 relative transition-colors duration-300 ${isFullScreen ? 'bg-[#06060c] pt-20' : 'bg-transparent'}`}
    >
      {/* HEADER SECTION */}
      <header id="app-header" className="flex justify-between items-center mb-6 border-b border-[#1c1c32]/40 pb-4">
        <div>
          <h1 className="logo font-mono text-sm tracking-[0.2em] text-[#6c63ff] font-bold uppercase transition-all duration-300 hover:text-[#3dffa0] cursor-pointer" onClick={() => setActiveTab('dash')}>
            ⬡ RelogioFoco
          </h1>
          <p className="text-[10px] text-[#52526e] tracking-wider mt-1 font-mono uppercase">Mixer & Alta Performance</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-xs font-semibold text-[#8b8ba8] flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#6c63ff]" />
            {currentDateString || "Sem conexão"}
          </div>
          {/* Daily metrics summary in header */}
          <div className="text-[10px] text-[#52526e] mt-1 font-mono">
            Meta: {dailyStats.hours}h de {config.goal}h ({dailyStats.percent}%)
          </div>
        </div>
      </header>

      {/* FLOATING ACTION ALERTS */}
      {alertMsg && (
        <div 
          id="status-alert"
          className={`flex items-center gap-3 p-3.5 mb-4 rounded-xl border text-xs font-semibold animate-fadeIn ${
            alertMsg.type === 'success' 
              ? 'bg-[#102a1e] border-[#3dffa0]/40 text-[#3dffa0]' 
              : 'bg-[#1a102d] border-[#6c63ff]/40 text-[#d4b9ff]'
          }`}
        >
          {alertMsg.type === 'success' ? <Award className="w-4 h-4 shrink-0 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* PRIMARY NAVIGATION TABS */}
      <nav id="navigation-tabs" className="nav-tabs grid grid-cols-4 bg-[#10101c] border border-[#1c1c32] p-1 rounded-[16px] mb-6 shadow-xl relative z-10 select-none">
        <button 
          id="btn-nav-dash"
          className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'dash' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
          onClick={() => setActiveTab('dash')}
        >
          <Clock className="w-4 h-4" />
          <span>Painel</span>
        </button>
        <button 
          id="btn-nav-tasks"
          className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
          onClick={() => setActiveTab('tasks')}
        >
          <div className="relative">
            <CheckSquare className="w-4 h-4" />
            {tasks.filter(t => !t.done).length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#ff6b6b] text-white font-sans text-[8px] px-1 rounded-full">{tasks.filter(t => !t.done).length}</span>
            )}
          </div>
          <span>Tarefas</span>
        </button>
        <button 
          id="btn-nav-logs"
          className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'logs' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
          onClick={() => setActiveTab('logs')}
        >
          <div className="relative">
            <History className="w-4 h-4" />
            {logs.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#3dffa0] text-black font-sans text-[8px] px-1 font-bold rounded-full">{logs.length}</span>
            )}
          </div>
          <span>Histórico</span>
        </button>
        <button 
          id="btn-nav-config"
          className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'config' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* MAIN CONTAINER CONTROLLING THE SEVERAL VIEWS */}
      <main id="main-content" className="flex-grow">

        {/* TAB 1: DASHBOARD VIEW */}
        <div id="tab-view-dash" className={`view ${activeTab === 'dash' ? 'active block' : 'hidden'}`}>
          <div className="clock-card bg-[#10101c] border border-[#1c1c32] rounded-[28px] p-6 text-center relative shadow-2xl overflow-hidden">
            {/* Visual background ambient glow bar matching countdown state */}
            {config.focusMode === 'pomodoro' && (
              <div 
                id="pmo-progress-bar" 
                className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-[#6c63ff] via-[#bf5eff] to-[#1c32ff] transition-all duration-300"
                style={{ width: `${pPercent}%` }}
              />
            )}

            {/* Micro-actions row inside card */}
            <div className="flex justify-between items-center mb-2">
              <span className="flex items-center gap-1 text-[10px] text-[#3dffa0] bg-[#102a1e] px-2 py-0.5 rounded-full font-mono uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-[#3dffa0]" />
                {config.focusMode === 'pomodoro' ? 'Modo Pomodoro' : 'Cronômetro Livre'}
              </span>
              <button 
                id="btn-fullscreen"
                title="Alternar Tela Cheia"
                onClick={toggleContainerFullscreen} 
                className="text-[#52526e] hover:text-[#e2e2f0] transition-colors p-1"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[10px] tracking-[0.2em] text-[#52526e] uppercase font-semibold mb-2 font-mono">
              {running ? "Foco em andamento" : "Sessão pronta"}
            </div>

            {/* BIG CHRONO DISPLAY */}
            <div 
              id="chrono-display" 
              className={`display font-mono font-bold leading-none select-all transition-all duration-300 origin-center ${
                running ? 'text-[#3dffa0] scale-105 active-flick' : 'text-[#e2e2f0]'
              }`}
              style={{ fontSize: 'clamp(4.2rem, 16vw, 6rem)', textShadow: running ? '0 0 16px rgba(61, 255, 160, 0.15)' : 'none' }}
            >
              {formatMinutesSeconds(secs)}
            </div>

            {/* REAL-TIME DYNAMIC STREAKS BAR PRODUCING EXCELLENT ENGAGEMENT */}
            <div className="my-1 border-b border-[#1c1c32]/40" />

            {/* ROTATING QUOTE BANNER */}
            <div className="quote-box min-h-[58px] flex flex-col justify-center items-center py-2 px-1 relative">
              <p 
                id="quote-text" 
                className={`text-xs italic text-[#e2e2f0] leading-relaxed transition-opacity duration-500 duration-500 max-w-[90%] ${
                  quoteFade ? 'opacity-100' : 'opacity-0'
                }`}
              >
                "{quotes[currentQuoteIndex].text}"
              </p>
              <span 
                id="quote-author" 
                className={`text-[9px] text-[#6c63ff] font-mono font-medium tracking-wider uppercase mt-1.5 transition-opacity duration-500 ${
                  quoteFade ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {quotes[currentQuoteIndex].author}
              </span>
            </div>

            {/* BUTTON CONTROLLER RINGS */}
            <div className="flex gap-4 justify-center items-center mt-3">
              <button 
                id="btn-reset-timer"
                onClick={resetTimer} 
                title="Reiniciar Tempo"
                className="btn-sec w-11 h-11 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#e2e2f0] hover:bg-[#1c1c32] hover:border-[#6c63ff] flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button 
                id="btn-trigger-timer"
                onClick={toggleTimer} 
                title={running ? "Pausar" : "Iniciar"}
                className="btn-main w-16 h-16 rounded-full bg-[#6c63ff] text-white hover:bg-[#584fe3] hover:scale-105 flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] focus:outline-none"
              >
                {running ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8.5 h-8.5 ml-1 fill-current" />}
              </button>

              <button 
                id="btn-finish-timer"
                onClick={handleFinishAndSave} 
                title="Salvar Sessão"
                className="btn-sec w-11 h-11 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#3dffa0] hover:bg-[#1c1c32] hover:border-[#3dffa0] flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GOOGLE ADS SENSE PLACEHOLDER */}
          <div className="ad-slot my-4 min-h-[75px] bg-[#10101c] border border-dashed border-[#1c1c32] rounded-2xl flex flex-col items-center justify-center text-center p-3">
            <span className="text-[9px] font-mono tracking-[0.2em] text-[#52526e] mb-1">Publicidade (Google AdSense)</span>
            <span className="text-[10px] text-[#8b8ba8]">Anúncio Responsivo Integrado</span>
          </div>

          {/* INTERACTIVE AMBIENT SOUND MIXER */}
          <section id="audio-mixer" className="mixer-card bg-[#10101c] border border-[#1c1c32] rounded-2xl p-4.5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="mixer-title text-[10px] uppercase tracking-[0.15em] text-[#52526e] font-mono font-bold">
                Som de Foco Ambiente (Sintetizador)
              </span>
              <Volume2 className="w-3.5 h-3.5 text-[#6c63ff]" />
            </div>

            <div className="space-y-3">
              {/* Rain Slider */}
              <div className="flex items-center gap-3">
                <span className="mixer-label text-xs w-20 text-[#e2e2f0] font-medium font-sans">🌧 Chuva</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeRain}
                  onChange={(e) => handleVolumeChange('rain', parseInt(e.target.value))}
                  className="mix-vol flex-grow h-1.5 rounded-lg bg-[#1c1c32] appearance-none cursor-pointer accent-[#6c63ff] focus:outline-none"
                />
                <span className="text-[9px] font-mono text-[#52526e] w-6 text-right">
                  {volumeRain}%
                </span>
              </div>

              {/* Forest Slider */}
              <div className="flex items-center gap-3">
                <span className="mixer-label text-xs w-20 text-[#e2e2f0] font-medium font-sans">🌿 Floresta</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeForest}
                  onChange={(e) => handleVolumeChange('forest', parseInt(e.target.value))}
                  className="mix-vol flex-grow h-1.5 rounded-lg bg-[#1c1c32] appearance-none cursor-pointer accent-[#6c63ff] focus:outline-none"
                />
                <span className="text-[9px] font-mono text-[#52526e] w-6 text-right">
                  {volumeForest}%
                </span>
              </div>

              {/* White Noise/Brown Noise Slider */}
              <div className="flex items-center gap-3">
                <span className="mixer-label text-xs w-20 text-[#e2e2f0] font-medium font-sans">〰 Ruído</span>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={volumeWhite}
                  onChange={(e) => handleVolumeChange('white', parseInt(e.target.value))}
                  className="mix-vol flex-grow h-1.5 rounded-lg bg-[#1c1c32] appearance-none cursor-pointer accent-[#6c63ff] focus:outline-none"
                />
                <span className="text-[9px] font-mono text-[#52526e] w-6 text-right">
                  {volumeWhite}%
                </span>
              </div>
            </div>
            
            <p className="text-[9px] text-[#52526e] text-center mt-3 font-mono">
              *Desenvolvido em Web Audio API nativo — funciona em dispositivos móveis e desktops.
            </p>
          </section>

          {/* REAL-TIME FREQUENCY VISUALIZER */}
          <AudioVisualizer />
        </div>

        {/* TAB 2: TASKS VIEW */}
        <div id="tab-view-tasks" className={`view ${activeTab === 'tasks' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-3.5 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#6c63ff]" />
              Foco Atual do Dia
            </h3>

            {/* QUICK FORM TO ADD TASKS */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input 
                type="text" 
                name="taskText"
                placeholder="No que vai focar agora?" 
                autoComplete="off"
                className="flex-grow bg-[#080810] border border-[#1c1c32] p-3 text-sm text-white rounded-xl placeholder-[#52526e] focus:outline-none focus:border-[#6c63ff] transition-all"
              />
              <button 
                type="submit"
                title="Adicionar Tarefa"
                className="bg-[#6c63ff] text-white p-3 rounded-xl font-bold cursor-pointer hover:bg-[#584fe3] transition-colors flex items-center justify-center shrink-0 w-11 focus:outline-none"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* DYNAMIC TASKS GENERATED FROM LOCAL OR DEFAULT STATE */}
            <div id="task-list" className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#52526e] font-mono bg-[#080810]/40 rounded-xl border border-[#1c1c32]/50">
                  Nenhuma tarefa pendente criada.
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`task-item bg-[#080810] border p-3.5 rounded-xl flex items-center gap-3 transition-opacity duration-200 ${
                      task.done ? 'border-[#1c1c32] opacity-50' : 'border-[#1c1c32] hover:border-[#6c63ff]'
                    }`}
                  >
                    <button 
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors focus:outline-none ${
                        task.done ? 'bg-[#3dffa0] border-[#3dffa0]' : 'border-[#52526e] hover:border-[#6c63ff]'
                      }`}
                    >
                      {task.done && <Check className="w-3.5 h-3.5 text-black stroke-[3.5px]" />}
                    </button>

                    <span 
                      onClick={() => handleToggleTask(task.id)}
                      className={`flex-grow text-xs cursor-pointer select-none truncate ${
                        task.done ? 'line-through text-[#52526e]' : 'text-[#e2e2f0]'
                      }`}
                    >
                      {task.text}
                    </span>

                    <button 
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      title="Deletar Tarefa"
                      className="btn-del p-1 text-[#ff6b6b]/60 hover:text-[#ff6b6b] transition-colors focus:outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TAB 3: LOGS HISTORY VIEW */}
        <div id="tab-view-logs" className={`view ${activeTab === 'logs' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#6c63ff]" />
                Histórico Geral de Hoje
              </h3>
              <div className="text-[10px] bg-[#1c1c32] px-2.5 py-1 rounded-md text-[#8b8ba8] font-mono">
                {logs.length} {logs.length === 1 ? 'registro' : 'registros'}
              </div>
            </div>

            {/* Stats board detailing focal effort */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#080810] border border-[#1c1c32] rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#52526e] font-mono block uppercase">Tempo Focado</span>
                <span className="text-base font-bold text-[#3dffa0] font-mono mt-0.5 block">{dailyStats.hours} horas</span>
              </div>
              <div className="bg-[#080810] border border-[#1c1c32] rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#52526e] font-mono block uppercase">Meta Cumprida</span>
                <span className="text-base font-bold text-[#6c63ff] font-mono mt-0.5 block">{dailyStats.percent}%</span>
              </div>
            </div>

            <div id="hist-list" className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#52526e] font-mono bg-[#080810]/40 rounded-xl border border-[#1c1c32]/50">
                  Nenhuma sessão concluída hoje ainda.<br />Utilize os controles de cronômetro no painel!
                </div>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center bg-[#080810] border border-[#1c1c32] p-3 rounded-xl leading-relaxed"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">Sessão Salva</span>
                      <span className="text-[9px] text-[#52526e] font-mono">{log.time}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#3dffa0]">
                      {formatMinutesSeconds(log.dur)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {logs.length > 0 && (
              <button 
                id="btn-clear-history"
                onClick={handleClearHistory}
                className="w-full mt-4 py-2 bg-transparent text-[#ff6b6b]/60 hover:text-[#ff6b6b] border border-dashed border-[#1c1c32] rounded-xl text-[10px] uppercase tracking-wider font-mono cursor-pointer transition-colors focus:outline-none"
              >
                Limpar logs de hoje
              </button>
            )}
          </div>
        </div>

        {/* TAB 4: CONFIG ARCHITECTURE VIEW */}
        <div id="tab-view-config" className={`view ${activeTab === 'config' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-4.5 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#6c63ff]" />
              Preferências do Relógio
            </h3>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              {/* Focus timer Mode toggle options selector */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Modo de Cronometragem</span>
                  <span className="text-[10px] text-[#52526e]">Defina como o tempo fluirá</span>
                </div>
                <select 
                  name="focusModeOpt" 
                  defaultValue={config.focusMode}
                  className="bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs text-[#6c63ff] font-bold rounded-lg focus:outline-none"
                >
                  <option value="pomodoro">Pomodoro (Retroceder)</option>
                  <option value="free">Livre (Progressivo)</option>
                </select>
              </div>

              {/* Goal daily target settings input */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Meta Diária (horas)</span>
                  <span className="text-[10px] text-[#52526e]">Sua meta total de foco</span>
                </div>
                <input 
                  type="number" 
                  name="goalTime" 
                  min="0.5" 
                  max="24" 
                  step="0.5"
                  defaultValue={config.goal}
                  className="w-16 bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs text-center text-[#6c63ff] font-bold rounded-lg focus:outline-none"
                />
              </div>

              {/* Focus target minutes */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Foco Pomodoro (min)</span>
                  <span className="text-[10px] text-[#52526e]">Período de cada ciclo</span>
                </div>
                <input 
                  type="number" 
                  name="focusTime" 
                  min="1" 
                  max="240"
                  defaultValue={config.focus}
                  className="w-16 bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs text-center text-[#6c63ff] font-bold rounded-lg focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-[#6c63ff] text-white rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer hover:bg-[#584fe3] transition-colors focus:outline-none"
              >
                Salvar Preferências
              </button>
            </form>
          </div>
        </div>

        {/* INLINE VIEW: PRIVACY POLICIES AND TERMS OF USER DIRECT EXAMPLES */}
        <div id="tab-view-privacy" className={`view ${activeTab === 'privacy' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-2 flex items-center gap-2">
              Privacidade & Termos
            </h3>
            <div className="text-xs text-[#8b8ba8] leading-relaxed space-y-3 max-h-[290px] overflow-y-auto pr-1">
              <p className="font-semibold text-white">Política de Privacidade:</p>
              <p>O Relógio Foco funciona inteiramente no seu navegador de forma local (offline-first). Não coletamos, rastreamos nem armazenamos suas tarefas ou registros de tempo em servidores externos.</p>
              
              <p className="font-semibold text-white">Sobre os Anúncios:</p>
              <p>Usamos anúncios simulados neste ambiente que servem apenas para simular a renderização de blocos do Google AdSense.</p>
              
              <p className="font-semibold text-white">Termos de Uso:</p>
              <p>Este utilitário é disponibilizado de forma gratuita, "como está", visando aumentar seu foco e produtividade de forma lúdica.</p>
            </div>
            <button 
              onClick={() => setActiveTab('dash')}
              className="w-full mt-4 py-2.5 bg-[#1c1c32] text-white rounded-xl text-xs font-bold hover:bg-[#1c1c32]/80 transition-colors focus:outline-none"
            >
              Voltar ao Painel
            </button>
          </div>
        </div>

      </main>

      {/* COMPACT CLEAN FOOTER */}
      <footer id="app-footer" className="text-center mt-6 pt-4 border-t border-[#1c1c32]/40 relative z-10 w-full select-none">
        <div className="foot-links flex gap-4 justify-center">
          <button 
            type="button"
            onClick={() => setActiveTab('privacy')} 
            className="text-[10px] text-[#6c63ff] hover:text-[#584fe3] font-mono uppercase bg-transparent border-none p-0 cursor-pointer"
          >
            Privacidade
          </button>
          <span className="text-[#1c1c32] text-[10px] select-none">|</span>
          <button 
            type="button"
            onClick={() => setActiveTab('privacy')} 
            className="text-[10px] text-[#6c63ff] hover:text-[#584fe3] font-mono uppercase bg-transparent border-none p-0 cursor-pointer"
          >
            Termos de Uso
          </button>
        </div>
        <small className="text-[9px] text-[#52526e] font-mono block mt-2.5">
          © 2026 RelogioFoco.com.br
        </small>
      </footer>
    </div>
  );
}
