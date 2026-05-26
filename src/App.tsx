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
  Award,
  Star,
  Eye,
  EyeOff,
  Flame,
  Zap,
  Activity,
  Wind,
  HelpCircle,
  X
} from 'lucide-react';
import { Task, FocusLog, AppConfig, Quote } from './types';
import { ambientAudio } from './ambientAudio';
import { AudioVisualizer } from './components/AudioVisualizer';
import { Knob } from './components/Knob';

// Motivational quotes in Portuguese, English, and Spanish
const quotesByLang: Record<'pt' | 'en' | 'es', Quote[]> = {
  pt: [
    { text: "A educação é a arma mais poderosa para mudar o mundo.", author: "Nelson Mandela" },
    { text: "Disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
    { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier" },
    { text: "Não pare até se orgulhar.", author: "Anônimo" },
    { text: "Foco é dizer não para cem outras boas ideias.", author: "Steve Jobs" },
    { text: "A paciência e a persistência têm um efeito mágico ante o qual as dificuldades somem.", author: "John Quincy Adams" },
    { text: "Seja comum. Seja simples. Seja você mesmo. Ria das suas falhas e persista.", author: "Socrates" },
    { text: "Obstáculos são aquelas coisas assustadoras que você vê quando desvia os olhos do seu objetivo.", author: "Henry Ford" },
    { text: "Sua mente é um instrumento excelente se usada corretamente.", author: "Eckhart Tolle" }
  ],
  en: [
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Don't stop until you're proud.", author: "Anonymous" },
    { text: "Focus is about saying no to a hundred other good ideas.", author: "Steve Jobs" },
    { text: "Patience and persistence have a magical effect before which difficulties disappear.", author: "John Quincy Adams" },
    { text: "Be ordinary. Be simple. Be yourself. Laugh at your failures and persist.", author: "Socrates" },
    { text: "Obstacles are those frightful things you see when you take your eyes off your goal.", author: "Henry Ford" },
    { text: "Your mind is a superb instrument if used rightly.", author: "Eckhart Tolle" }
  ],
  es: [
    { text: "La educación es el arma más poderosa para cambiar el mundo.", author: "Nelson Mandela" },
    { text: "La disciplina es el puente entre las metas y los logros.", author: "Jim Rohn" },
    { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" },
    { text: "No te detengas hasta sentirte orgulloso.", author: "Anónimo" },
    { text: "El enfoque consiste en decir no a otras cien buenas ideas.", author: "Steve Jobs" },
    { text: "La paciencia y la persistencia tienen un efecto mágico ante el cual las dificultades desaparecen.", author: "John Quincy Adams" },
    { text: "Sé común. Sé simple. Sé tú mismo. Ríete de tus fallas y persiste.", author: "Socrates" },
    { text: "Los obstáculos son esas cosas aterradoras que ves cuando desvías los ojos de tu objetivo.", author: "Henry Ford" },
    { text: "Tu mente es un instrumento excelente si se utiliza correctamente.", author: "Eckhart Tolle" }
  ]
};

// Full application translation system
const translations = {
  pt: {
    subtitle: "Mixer & Estação de Alta Performance",
    noConn: "Sem conexão",
    goal: "Meta",
    of: "de",
    tabDash: "Painel",
    tabTasks: "Tarefas",
    tabLogs: "Histórico",
    tabConfig: "Ajustes",
    pmodo: "Modo Pomodoro",
    freemode: "Cronômetro Livre",
    focusInProgress: "Concentração Ativa",
    sessionReady: "Estação Pronta",
    resetBtn: "Reiniciar Tempo",
    startBtn: "Iniciar",
    pauseBtn: "Pausar",
    saveBtn: "Salvar",
    ambientSoundsTitle: "Sintetizador Orgânico de Foco",
    rain: "Chuva Real",
    forest: "Floresta c/ Crickets",
    noise: "Ondas do Mar",
    webaudioNotice: "*Áudio 3D sintetizado localmente com Web Audio API nativo — sem consumo de internet.",
    focusTitle: "Foco Atual do Dia",
    addTaskPlaceholder: "No que você vai se concentrar agora?",
    addTaskTooltip: "Adicionar Tarefa",
    deleteTaskTooltip: "Deletar Tarefa",
    noTasks: "Nenhuma tarefa pendente criada.",
    historyTitle: "Painel de Conquistas de Hoje",
    focusTimeLog: "Tempo Focado",
    targetCompleted: "Meta Cumprida",
    hoursText: "horas",
    noLogs: "Nenhuma sessão concluída hoje ainda.\nUtilize os controles de cronômetro no painel!",
    clearLogsBtn: "Limpar logs de hoje",
    clearLogsWarning: "⚠️ Tem certeza? Clique aqui novamente para apagar todos os logs",
    configTitle: "Preferências do Relógio",
    timingMode: "Modo de Cronometragem",
    timingDesc: "Defina como o tempo fluirá",
    pomodoroOption: "Pomodoro (Retroceder)",
    freeOption: "Livre (Progressivo)",
    dailyGoal: "Meta Diária (horas)",
    dailyGoalDesc: "Sua meta total de foco",
    pomodoroFocusMin: "Foco Pomodoro (min)",
    pomodoroFocusDesc: "Período de cada ciclo",
    savePreferences: "Salvar Preferências",
    privacyTab: "Privacidade",
    termsTab: "Termos de Uso",
    alertTooShort: "Sessão muito curta para ser registrada! Cubra pelo menos 5 segundos de foco.",
    alertSaved: "Sessão de foco salva! +{minutesString} minutos registrados com sucesso.",
    alertPomodoroEnd: "Pomodoro concluído! Excelente trabalho! 🎉",
    alertPrefSaved: "Configurações salvas e aplicadas!",
    alertHistReset: "Histórico de foco redefinido.",
    alertTaskAdded: "Tarefa adicionada!",
    privacyHeading: "Privacidade & Termos de Uso (LGPD / GDPR)",
    privacyButton: "Ciente e de Acordo ✓ Voltar ao Painel",
    record: "registro",
    records: "registros",
    shortBreak: "Pausa Curta",
    longBreak: "Pausa Longa",
    breakInProgress: "Momento de Descanso ☕",
    primaryGoalLabel: "Objetivo Principal Selecionado",
    pressToPin: "Marque a estrela ⭐ nas tarefas para fixá-las aqui",
    presetsLabel: "Presets Rápidos de Ambiente",
    presetStorm: "Tempestade Estudo",
    presetForest: "Retiro na Floresta",
    presetOcean: "Vácuo Cósmico",
    presetCafe: "Bistrô Aconchego",
    presetMute: "Silenciar Total",
    themeLabel: "Estilo Visual Cósmico",
    activeZenLabel: "Distrações Bloqueadas",
    ratingTitle: "Como foi sua concentração?",
    ratingPlaceholder: "Avalie de 1 a 5 estrelas",
    saveRatingBtn: "Salvar e Continuar",
    focusQuality: "Qualidade do Foco",
    streakLabel: "Sequência de Hábitos",
    streakDays: "dias consecutivos focado",
    milestoneAchieved: "Parabéns! Você alcançou sua meta diária de foco! 🏆🎉",
    breathingGuide: "Guia de Respiração para Foco",
    breathInhale: "Inale suavemente...",
    breathHold: "Segure o ar...",
    breathExhale: "Exale o ar devagar...",
    breathHoldEx: "Aguarde...",
    soundFaded: "Áudio atenuado automaticamente."
  },
  en: {
    subtitle: "Mixer & High Performance Station",
    noConn: "No connection",
    goal: "Goal",
    of: "of",
    tabDash: "Dashboard",
    tabTasks: "Tasks",
    tabLogs: "History",
    tabConfig: "Settings",
    pmodo: "Pomodoro Mode",
    freemode: "Free Stopwatch",
    focusInProgress: "Active Focus Session",
    sessionReady: "Station Ready",
    resetBtn: "Reset Timer",
    startBtn: "Start",
    pauseBtn: "Pause",
    saveBtn: "Save",
    ambientSoundsTitle: "Organic Focus Synthesizer",
    rain: "Real Rain",
    forest: "Forest & Crickets",
    noise: "Ocean Waves",
    webaudioNotice: "*3D audio synthesized locally using native Web Audio API — zero data usage.",
    focusTitle: "Current Daily Focus",
    addTaskPlaceholder: "What will you concentrate on now?",
    addTaskTooltip: "Add Task",
    deleteTaskTooltip: "Delete Task",
    noTasks: "No pending tasks created.",
    historyTitle: "Today's Achievement Board",
    focusTimeLog: "Focused Time",
    targetCompleted: "Goal Achieved",
    hoursText: "hours",
    noLogs: "No sessions completed today yet.\nUse the timer controls on the dashboard!",
    clearLogsBtn: "Clear today's logs",
    clearLogsWarning: "⚠️ Are you sure? Click here again to erase all logs",
    configTitle: "Clock Preferences",
    timingMode: "Timing Mode",
    timingDesc: "Define how time will flow",
    pomodoroOption: "Pomodoro (Countdown)",
    freeOption: "Free (Stopwatch)",
    dailyGoal: "Daily Goal (hours)",
    dailyGoalDesc: "Your total focus target",
    pomodoroFocusMin: "Pomodoro Focus (min)",
    pomodoroFocusDesc: "Duration of each cycle",
    savePreferences: "Save Preferences",
    privacyTab: "Privacy",
    termsTab: "Terms of Use",
    alertTooShort: "Session too short to be recorded! Cover at least 5 seconds of focus.",
    alertSaved: "Focus session saved! +{minutesString} minutes recorded successfully.",
    alertPomodoroEnd: "Pomodoro finished! Great work! 🎉",
    alertPrefSaved: "Preferences saved and applied!",
    alertHistReset: "Focus history reset.",
    alertTaskAdded: "Task added!",
    privacyHeading: "Privacy & Terms of Use (GDPR / LGPD)",
    privacyButton: "Understood & Agree ✓ Back to Dashboard",
    record: "record",
    records: "records",
    shortBreak: "Short Break",
    longBreak: "Long Break",
    breakInProgress: "Cozy Resting Moments ☕",
    primaryGoalLabel: "Main Selected Objective",
    pressToPin: "Check the star ⭐ on tasks to pin them here",
    presetsLabel: "Quick Healing Presets",
    presetStorm: "Study Storm",
    presetForest: "Forest Retreat",
    presetOcean: "Cosmic Void",
    presetCafe: "Cozy Bistro",
    presetMute: "Mute All",
    themeLabel: "Cosmic Theme Style",
    activeZenLabel: "Distractions Blocked",
    ratingTitle: "How focused were you?",
    ratingPlaceholder: "Rate 1 to 5 stars",
    saveRatingBtn: "Save and Continue",
    focusQuality: "Focus Quality",
    streakLabel: "Habit Streak",
    streakDays: "consecutive days of focus",
    milestoneAchieved: "Congratulations! You have met your daily focus goal! 🏆🎉",
    breathingGuide: "Breathing Pacer for Focus",
    breathInhale: "Inhale slowly...",
    breathHold: "Hold breath...",
    breathExhale: "Exhale slowly...",
    breathHoldEx: "Wait...",
    soundFaded: "Audio faded out automatically."
  },
  es: {
    subtitle: "Mezclador y Estación de Alto Rendimiento",
    noConn: "Sin conexión",
    goal: "Meta",
    of: "de",
    tabDash: "Panel",
    tabTasks: "Tareas",
    tabLogs: "Historial",
    tabConfig: "Ajustes",
    pmodo: "Modo Pomodoro",
    freemode: "Cronómetro Libre",
    focusInProgress: "Concentración Activa",
    sessionReady: "Estación Lista",
    resetBtn: "Reiniciar Tiempo",
    startBtn: "Iniciar",
    pauseBtn: "Pausar",
    saveBtn: "Guardar",
    ambientSoundsTitle: "Sintetizador Orgánico de Enfoque",
    rain: "Lluvia Real",
    forest: "Bosque y Grillos",
    noise: "Ondas del Mar",
    webaudioNotice: "*Audio 3D sintetizado con Web Audio API nativo — sin consumo de datos.",
    focusTitle: "Enfoque Diario Actual",
    addTaskPlaceholder: "¿En qué te vas a concentrar hoy?",
    addTaskTooltip: "Agregar Tarea",
    deleteTaskTooltip: "Eliminar Tarea",
    noTasks: "No hay tareas pendientes creadas.",
    historyTitle: "Tablero de Logros de Hoy",
    focusTimeLog: "Tiempo Enfocado",
    targetCompleted: "Meta Cumplida",
    hoursText: "horas",
    noLogs: "Ninguna sesión completada hoy todavía.\n¡Usa los controles del temporizador en el panel!",
    clearLogsBtn: "Limpiar registros de hoy",
    clearLogsWarning: "⚠️ ¿Estás seguro? Haz clic de nuevo para borrar todos los registros",
    configTitle: "Preferencias del Reloj",
    timingMode: "Modo de Temporización",
    timingDesc: "Define cómo fluirá el tiempo",
    pomodoroOption: "Pomodoro (Cuenta regresiva)",
    freeOption: "Libre (Cronómetro)",
    dailyGoal: "Meta Diaria (horas)",
    dailyGoalDesc: "Tu meta total de enfoque",
    pomodoroFocusMin: "Enfoque Pomodoro (min)",
    pomodoroFocusDesc: "Duración de cada ciclo",
    savePreferences: "Guardar Preferencias",
    privacyTab: "Privacidad",
    termsTab: "Términos de Uso",
    alertTooShort: "¡Sesión demasiado corta para ser registrada! Cubre al menos 5 segundos de enfoque.",
    alertSaved: "¡Sesión de enfoque guardada! +{minutesString} minutos registrados con éxito.",
    alertPomodoroEnd: "¡Pomodoro finalizado! ¡Excelente trabajo! 🎉",
    alertPrefSaved: "¡Configuraciones guardadas y aplicadas!",
    alertHistReset: "Historial de enfoque restablecido.",
    alertTaskAdded: "¡Tarea agregada!",
    privacyHeading: "Privacidad y Términos de Uso (GDPR / LGPD)",
    privacyButton: "Entendido y de Acuerdo ✓ Volver al Panel",
    record: "registro",
    records: "registros",
    shortBreak: "Pausa Corta",
    longBreak: "Pausa Larga",
    breakInProgress: "Descanso Acogedor ☕",
    primaryGoalLabel: "Objetivo Principal Seleccionado",
    pressToPin: "Marque la estrella ⭐ en las tareas para fijarlas aquí",
    presetsLabel: "Presets Rápidos de Sonido",
    presetStorm: "Estudio Tormenta",
    presetForest: "Retiro en Bosque",
    presetOcean: "Vacío Cósmico",
    presetCafe: "Bistró Acogedor",
    presetMute: "Silenciar Todo",
    themeLabel: "Estilo Visual Cósmico",
    activeZenLabel: "Distracciones Bloqueadas",
    ratingTitle: "¿Cómo estuvo tu concentración?",
    ratingPlaceholder: "Califica de 1 a 5 estrellas",
    saveRatingBtn: "Guardar y Continuar",
    focusQuality: "Calidad de Enfoque",
    streakLabel: "Racha de Hábitos",
    streakDays: "días seguidos enfocado",
    milestoneAchieved: "¡Felicitaciones! ¡Has alcanzado tu meta diaria de enfoque! 🏆🎉",
    breathingGuide: "Guía de Respiración para Enfoque",
    breathInhale: "Inhala suavemente...",
    breathHold: "Mantén el aire...",
    breathExhale: "Exhala despacio...",
    breathHoldEx: "Espera...",
    soundFaded: "Audio atenuado automáticamente."
  }
};

const privacyContent = {
  pt: {
    t1: "1. DECLARAÇÃO DE PRIVACIDADE COERENTE À LGPD",
    p1: <>O <strong>Relógio Foco (RelogioFoco)</strong> adota uma arquitetura estritamente <em>offline-first</em> e local. Em plena observância à <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong>, esclarecemos que:</>,
    li1_1: <><strong>Ausência de Coleta Remota:</strong> Suas tarefas inseridas, tempos cronometrados, logs de produtividade e preferências de configuração são processados e armazenados exclusivamente em seu próprio dispositivo de forma local (via <code>localStorage</code> do navegador). Não possuímos bancos de dados remotos nem servidores que interceptem esses dados.</>,
    li1_2: <><strong>Direitos dos Titulares (Art. 18, LGPD):</strong> Como os dados permanecem estritamente sob sua posse física no navegador, quaisquer direitos de acesso, retificação, anonimização ou exclusão definitiva de registros são exercidos de forma inteiramente autônoma por você, limpando os cookies/cache do site ou clicando em "Limpar logs de hoje".</>,
    li1_3: <><strong>Cookies de Terceiros e Publicidade:</strong> Eventuais veiculações de anúncios (como via redes do Google AdSense) utilizam identificadores integrados de navegação para personalização opcional do próprio Google. Recomendamos revisar as configurações de cookies do seu navegador para gerenciar suas preferências globais de publicidade.</>,
    
    t2: "2. TERMOS DE USO E LICENÇA DE SERVIÇO",
    p2: <>Ao acessar este utilitário gratuito, você manifesta concordância plena às seguintes condições sob o ordenamento do <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong>:</>,
    li2_1: <><strong>Licença de Uso:</strong> É disponibilizada ao usuário uma licença gratuita de uso pessoal, não comercial, revogável e não exclusiva deste painel ("as is" / no estado em que se encontra), sem qualquer alteração técnica ou violação sobre o repositório original.</>,
    li2_2: <><strong>Isenção Total de Responsabilidade Civil:</strong> O proprietário e desenvolvedores do aplicativo não assumem nenhuma responsabilidade legal, direta ou indireta, por perdas acidentais de tarefas ou logs devidas a formatações de cache, exclusões automáticas causadas pelo navegador, trocas de dispositivo, panes de energia ou atualizações de sistema.</>,
    li2_3: <><strong>Foco & Resultados:</strong> O utilitário constitui mecanismo facilitador de produtividade lúdica e estética. Não há garantias de ganho de desempenho individual, resultados acadêmicos ou profissionais. O usuário assume total autoria sobre seus horários de trabalho, repouso e saúde física (prevenção a lesões por esforço repetitivo - LER/DORT).</>,
    li2_4: <><strong>Modificações do Serviço:</strong> O aplicativo poderá passar por atualizações funcionais, otimizações ou descontinuações gerais a qualquer tempo sem prévia notificação e sem dar direito a indenizações.</>,
    
    t3: "3. LEGISLAÇÃO APLICÁVEL E FORO",
    p3: <>Estes termos e políticas são regidos de acordo com as leis vigentes na República Estatutária da Federação do Brasil. Para dirimir qualquer controvérsia judicial decorrente deste termo, elege-se prioritariamente o Foro de domicílio do proprietário da ferramenta, renunciando-se expressamente sobre qualquer outro por mais privilegiado que se apresente.</>
  },
  en: {
    t1: "1. PRIVACY COMPLIANT (GDPR & LGPD COMPLIANT)",
    p1: <>The <strong>Focus Clock (RelogioFoco)</strong> adopts a strictly <em>offline-first</em> and local architecture. In full compliance with the <strong>General Data Protection Regulation (GDPR)</strong> and <strong>LGPD</strong>, we clarify that:</>,
    li1_1: <><strong>No Remote Collection:</strong> Your entered tasks, completed Focus logs, and preferences are processed and stored exclusively inside your own device locally (via the browser's <code>localStorage</code>). We do not run remote databases that collect or intercept your data.</>,
    li1_2: <><strong>Subject Rights (GDPR & LGPD):</strong> Because data remains strictly in your physical possession within the browser, any rights of access, rectification, or total deletion are exercised fully by you autonomously by clearing browser cookies/cache or clicking "Clear today's logs".</>,
    li1_3: <><strong>Third-Party Cookies & Ad networks:</strong> Optional advertisements (such as Google AdSense blocks) may use cookie identifiers for personalized matching. We suggest checking your browser configuration values to handle global ad preference parameters.</>,
    
    t2: "2. TERMS OF SERVICE & USABLE LICENSE",
    p2: <>By accessing this free utility, you express full agreement and consent to the following terms under standard internet limitations:</>,
    li2_1: <><strong>Use License:</strong> You are granted a free, personal, non-commercial, revocable, and non-exclusive license to use this focus panel "as is" and in its current state, without technical tampering.</>,
    li2_2: <><strong>Total Liability Limitation:</strong> The publisher and developers of this application bear no legal responsibility, direct or indirect, for accidental loss of tasks or logs due to cache formatting, browser cleanup, device swapping, or system state changes.</>,
    li2_3: <><strong>Focus & Outcomes:</strong> This tool is purely a gamified and aesthetic performance booster. There are no professional performance guarantees or academic success promises. The user must watch their own breaks and guard physical health.</>,
    li2_4: <><strong>Service Amendments:</strong> This utility can receive code structural modifications, visual improvements, or total retirement at any time without prior notifications.</>,
    
    t3: "3. APPLICABLE LAW & JURISDICTION",
    p3: <>These terms and policies are governed and interpreted in accordance with applicable internet and data safety regulations. For resolving any judicial disputes, the registered business domicile of the tool publisher is elected as primary jurisdiction, renouncing any other forum.</>
  },
  es: {
    t1: "1. COHERENTE DECLARACIÓN DE PRIVACIDAD (GDPR & LGPD)",
    p1: <>El <strong>Reloj Foco (RelogioFoco)</strong> adopta una arquitectura de operación de tipo <em>offline-first</em> e local. En pleno cumplimiento de las disposiciones de seguridad (GDPR) y (LGPD), aclaramos que:</>,
    li1_1: <><strong>Sin recolección de datos:</strong> Sus metas, tareas, y registros se guardan y procesan de forma exclusiva en la memoria de su navegador (<code>localStorage</code>). No poseemos registros o persistencias remotas en la nube.</>,
    li1_2: <><strong>Sus Derechos fundamentales:</strong> Al estar guardado en su propio computador local, puede ejercer el derecho de remoción y olvido de manera autónoma reiniciando los datos o eliminando la caché de su explorador móvil o de escritorio.</>,
    li1_3: <><strong>Publicidades externas:</strong> Determinados bloques promocionales de AdSense de Google podrían almacenar cookies para personalización. Considere y configure estos parámetros desde los ajustes de privacidad de su navegador.</>,
    
    t2: "2. TÉRMINOS Y CONDICIONES DE USO DE LA HERRAMIENTA",
    p2: <>Su visita o uso gratuito del panel implica su acuerdo y aceptación formal de las siguientes pautas legales corporativas:</>,
    li2_1: <><strong>Licencia otorgada:</strong> Le concedemos un permiso limitado de uso privado no comercial de este dashboard en su estado técnico tal como se provee y presenta.</>,
    li2_2: <><strong>Exclusión de reclamos civiles:</strong> Ninguno de los creadores de esta aplicación asume responsabilidad civil o mercantil por pérdidas súbitas de registros, desconfiguraciones del navegador, fallos eléctricos locales u optimizaciones preventivas del sistema gráfico.</>,
    li2_3: <><strong>Salud corporal:</strong> El cronómetro es un indicador referencial de soporte de productividad. Sugerimos encarecidamente intercalar sesiones con ejercicios físicos de estiramiento y relajación oportunos para cuidar su salud.</>,
    li2_4: <><strong>Modificaciones técnicas:</strong> El software y sus apartados de interfaz pueden variar, cambiar de estilo visual, expandirse o depurarse técnicamente sin previo aviso unilateral.</>,
    
    t3: "3. JURISDICCIÓN COMPETENTE",
    p3: <>Este acuerdo y el entendimiento de su texto se rige e interpreta de conformidad con el domicilio matriz de registro fiscal del editor web principal de la solución, renunciando a otros fueros.</>
  }
};

// Theme presets visual style config tokens mapper
const ThemePresets = {
  violet: {
    primary: '#6c63ff',
    primaryHover: '#584fe3',
    shadowGlow: 'rgba(108, 99, 255, 0.25)',
    shadowGlowHeavy: 'rgba(108, 99, 255, 0.45)',
    textColor: 'text-[#6c63ff]',
    borderColor: 'border-[#6c63ff]',
    bgGlow: 'from-[#6c63ff]/10',
    accentClass: 'bg-[#6c63ff]',
    accentHoverClass: 'hover:bg-[#6c63ff]'
  },
  emerald: {
    primary: '#10b981',
    primaryHover: '#059669',
    shadowGlow: 'rgba(16, 185, 129, 0.25)',
    shadowGlowHeavy: 'rgba(16, 185, 129, 0.45)',
    textColor: 'text-[#10b981]',
    borderColor: 'border-[#10b981]',
    bgGlow: 'from-[#10b981]/10',
    accentClass: 'bg-[#10b981]',
    accentHoverClass: 'hover:bg-[#10b981]'
  },
  ocean: {
    primary: '#0ea5e9',
    primaryHover: '#0284c7',
    shadowGlow: 'rgba(14, 165, 233, 0.25)',
    shadowGlowHeavy: 'rgba(14, 165, 233, 0.45)',
    textColor: 'text-[#0ea5e9]',
    borderColor: 'border-[#0ea5e9]',
    bgGlow: 'from-[#0ea5e9]/10',
    accentClass: 'bg-[#0ea5e9]',
    accentHoverClass: 'hover:bg-[#0ea5e9]'
  },
  amber: {
    primary: '#f59e0b',
    primaryHover: '#d97706',
    shadowGlow: 'rgba(245, 158, 11, 0.25)',
    shadowGlowHeavy: 'rgba(245, 158, 11, 0.45)',
    textColor: 'text-[#f59e0b]',
    borderColor: 'border-[#f59e0b]',
    bgGlow: 'from-[#f59e0b]/10',
    accentClass: 'bg-[#f59e0b]',
    accentHoverClass: 'hover:bg-[#f59e0b]'
  }
};

export default function App() {
  // Language localization state
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>(() => {
    const saved = localStorage.getItem('rf_lang');
    if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
    if (typeof navigator !== 'undefined') {
      const defaultLang = navigator.language.split('-')[0];
      if (defaultLang === 'pt') return 'pt';
      if (defaultLang === 'es') return 'es';
      if (defaultLang === 'en') return 'en';
    }
    return 'pt';
  });

  // Save language preference to LocalStorage
  useEffect(() => {
    localStorage.setItem('rf_lang', lang);
  }, [lang]);

  // Translate dictionary helper shortcut
  const t = translations[lang];

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dash' | 'tasks' | 'logs' | 'config' | 'privacy'>('dash');

  // Load configuration from localStorage
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('rf_pro_v1');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.cfg) {
          const parsed = p.cfg;
          return {
            focus: parsed.focus || 25,
            goal: parsed.goal || 4,
            focusMode: parsed.focusMode || 'pomodoro',
            theme: parsed.theme || 'violet',
            activeZen: parsed.activeZen || false,
            breathingActive: parsed.breathingActive !== undefined ? parsed.breathingActive : true,
            streak: parsed.streak || 0
          };
        }
      } catch (e) {}
    }
    return { 
      focus: 25, 
      goal: 4, 
      focusMode: 'pomodoro', 
      theme: 'violet', 
      activeZen: false, 
      breathingActive: true, 
      streak: 0 
    };
  });

  // Current visual theme configuration helper
  const activeThemeKey = config.theme || 'violet';
  const CTheme = ThemePresets[activeThemeKey];

  // Load or initialize tasks list with localStorage
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('rf_pro_v1');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.tasks) return p.tasks;
      } catch (e) {}
    }
    const savedLang = localStorage.getItem('rf_lang');
    const initLang = (savedLang === 'pt' || savedLang === 'en' || savedLang === 'es') ? savedLang : 'pt';
    const defaultTasks = {
      pt: [
        { id: 1, text: "Focar em alta performance de código ⚡", done: false, starred: true },
        { id: 2, text: "Configurar mixer de áudio ambiente de chuva 🌧", done: true, starred: false }
      ],
      en: [
        { id: 1, text: "Focus on high performance coding ⚡", done: false, starred: true },
        { id: 2, text: "Configure rain ambient audio mixer 🌧", done: true, starred: false }
      ],
      es: [
        { id: 1, text: "Enfoque en alta calidad de código ⚡", done: false, starred: true },
        { id: 2, text: "Configurar mezclador de lluvia ambiental 🌧", done: true, starred: false }
      ]
    };
    return defaultTasks[initLang as 'pt' | 'en' | 'es'];
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

  // Flow State for break intervals in Pomodoro Mode
  // 'focus' -> work period, 'shortBreak' -> brief 5m, 'longBreak' -> longer 15m
  const [timerType, setTimerType] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');

  // Timer parameters
  const [running, setRunning] = useState<boolean>(false);
  
  // Dynamic seconds configuration based on timer state
  const [secs, setSecs] = useState<number>(() => {
    return config.focusMode === 'pomodoro' ? config.focus * 60 : 0;
  });

  // Starting parameters for dynamic percentage calculations
  const [initialPomodoroSecs, setInitialPomodoroSecs] = useState<number>(() => {
    return config.focus * 60;
  });

  // Dynamic Focus Rating Session Recap Popup State
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [helpCardDismissed, setHelpCardDismissed] = useState<boolean>(false);
  const [timerShowHelp, setTimerShowHelp] = useState<boolean>(true);

  // Automated visual delay for floating smart card visibility
  useEffect(() => {
    if (running) {
      setTimerShowHelp(false);
    } else {
      const waitTimer = setTimeout(() => {
        setTimerShowHelp(true);
      }, 2500); // 2.5 second soft delay
      return () => clearTimeout(waitTimer);
    }
  }, [running]);
  const [sessionSecsToSave, setSessionSecsToSave] = useState<number>(0);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTag, setReviewTag] = useState<'excellent' | 'good' | 'distracted'>('excellent');

  // Interactive Breath Trainer Guidance state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdEx'>('inhale');
  const [breathSecs, setBreathSecs] = useState<number>(4);

  // Sound volumes state
  const [volumeRain, setVolumeRain] = useState<number>(0);
  const [volumeForest, setVolumeForest] = useState<number>(0);
  const [volumeWhite, setVolumeWhite] = useState<number>(0);

  // Quote rotation control
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);
  const [quoteFade, setQuoteFade] = useState<boolean>(true);

  // Current formatted date system
  const [currentDateString, setCurrentDateString] = useState<string>('');
  
  // Custom alerts triggers
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  // Fullscreen container references
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  // Time references
  const intervalRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);

  // Starred Task Pinned to focus
  const starredTask = tasks.find(t => t.starred && !t.done);

  // Calculate daily focus scores
  const dailyStats = calculateDailyProgress();

  // Habit Streak calculation logic
  const calculatedStreak = calculateFocusStreak(logs);

  // Update dates based on locale
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US';
      setCurrentDateString(now.toLocaleDateString(locale, { 
        day: 'numeric', 
        month: 'short',
        weekday: 'short'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  // Sync state modifications to LocalStorage
  useEffect(() => {
    localStorage.setItem('rf_pro_v1', JSON.stringify({ cfg: config, tasks }));
  }, [config, tasks]);

  // Handle active timer increments/decrements
  useEffect(() => {
    if (running) {
      // Unmute/fade in sound smoothly if any volume slider is above zero
      ambientAudio.fadeMasterVolume(1.0, 1.2);

      startTimeRef.current = Date.now();
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
              
              // End of timer! Trigger automated Break or Focus Saved recap
              if (timerType === 'focus') {
                playFinishChime();
                triggerAlert(t.alertPomodoroEnd, "success");
                
                // Prompt Focus Rating pop modal
                setSessionSecsToSave(config.focus * 60);
                setShowRatingModal(true);
              } else {
                // Return to Focus
                playBreakFinishChime();
                setTimerType('focus');
                setSecs(config.focus * 60);
                setInitialPomodoroSecs(config.focus * 60);
                triggerAlert(lang === 'pt' ? "Descanso finalizado! Hora de voltar ao foco. 🔥" : lang === 'es' ? "¡Descanso finalizado! Hora de volver a concentrarse. 🔥" : "Break complete! Back to focus. 🔥", "info");
              }
            } else {
              setSecs(nextSecs);
            }
          } else {
            // Free mode increases progress
            setSecs(startingSecs + deltaSecs);
          }
        }
      }, 200);
    } else {
      // Fade out audio when paused
      ambientAudio.fadeMasterVolume(0.001, 1.5);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, config.focusMode, timerType, lang, config.focus]);

  // Breathing pacer ticker loop (4s inflate, 4s hold, 4s exhale, 4s hold)
  useEffect(() => {
    let breathInterval: any = null;
    if (config.breathingActive) {
      breathInterval = setInterval(() => {
        setBreathSecs((prev) => {
          if (prev <= 1) {
            // Switch phases
            setBreathPhase((currentPhase) => {
              if (currentPhase === 'inhale') return 'hold';
              if (currentPhase === 'hold') return 'exhale';
              if (currentPhase === 'exhale') return 'holdEx';
              return 'inhale';
            });
            return 4; // Reset to 4s count
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (breathInterval) clearInterval(breathInterval);
    };
  }, [config.breathingActive]);

  // Adjust remaining timer counters immediately when configuration parameters change
  useEffect(() => {
    if (!running) {
      if (config.focusMode === 'pomodoro') {
        if (timerType === 'focus') {
          setSecs(config.focus * 60);
          setInitialPomodoroSecs(config.focus * 60);
        } else if (timerType === 'shortBreak') {
          setSecs(5 * 60);
          setInitialPomodoroSecs(5 * 60);
        } else {
          setSecs(15 * 60);
          setInitialPomodoroSecs(15 * 60);
        }
      } else {
        setSecs(0);
      }
    }
  }, [config.focus, config.focusMode, timerType]);

  // Browser tab title updates
  useEffect(() => {
    const timerStr = formatMinutesSeconds(secs);
    const indicatorEmoji = running ? '⏱️' : '⏸️';
    const breakSymbol = timerType !== 'focus' ? '☕ ' : '';
    const localizedTitle = lang === 'pt' ? 'Relógio Foco' : lang === 'es' ? 'Reloj Foco' : 'Focus Clock';
    document.title = `[${breakSymbol}${timerStr}] ${indicatorEmoji} ${localizedTitle}`;
  }, [secs, running, lang, timerType]);

  // Quote carousel auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteFade(false);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotesByLang[lang].length);
        setQuoteFade(true);
      }, 500);
    }, 16000);
    return () => clearInterval(interval);
  }, [lang]);

  // Global Keydown bindings (Space Bar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Custom synthesized alarms: Beautiful focus-end chime (C Major Arpeggio)
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
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        
        gain.gain.setValueAtTime(0.18, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.45);
      });
    } catch (e) {
      console.warn("Audio chime unsupported:", e);
    }
  };

  // Custom synthesized break chime
  const playBreakFinishChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      const notes = [554.37, 698.46, 880.00]; // Db5, F5, A5 (warm chord)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0.14, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.5);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.55);
      });
    } catch (e) {}
  };

  // Toast Alerts Trigger
  const triggerAlert = (text: string, type: 'success' | 'info') => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  // Sound Volume Handler
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

  // Quick Preset Mixer Shortcuts
  const applyAudioPreset = (presetKey: 'storm' | 'forest' | 'ocean' | 'cafe' | 'mute') => {
    let rainVal = 0, forestVal = 0, whiteVal = 0;

    if (presetKey === 'storm') {
      rainVal = 95; forestVal = 10; whiteVal = 15;
    } else if (presetKey === 'forest') {
      rainVal = 25; forestVal = 85; whiteVal = 0;
    } else if (presetKey === 'ocean') {
      rainVal = 0; forestVal = 0; whiteVal = 80;
    } else if (presetKey === 'cafe') {
      rainVal = 62; forestVal = 0; whiteVal = 48;
    } // 'mute' has all zeroes

    setVolumeRain(rainVal);
    setVolumeForest(forestVal);
    setVolumeWhite(whiteVal);

    ambientAudio.updateRain(rainVal);
    ambientAudio.updateForest(forestVal);
    ambientAudio.updateWhite(whiteVal);

    const alertMessage = {
      pt: `Preset carregado: ${t[`preset${presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}` as keyof typeof t] || presetKey}`,
      en: `Preset loaded: ${t[`preset${presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}` as keyof typeof t] || presetKey}`,
      es: `Preset cargado: ${t[`preset${presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}` as keyof typeof t] || presetKey}`
    };
    triggerAlert(alertMessage[lang], "info");
  };

  // Timer Controls
  const toggleTimer = () => {
    setRunning(!running);
  };

  const resetTimer = () => {
    setRunning(false);
    if (config.focusMode === 'pomodoro') {
      if (timerType === 'focus') {
        setSecs(config.focus * 60);
      } else if (timerType === 'shortBreak') {
        setSecs(5 * 60);
      } else {
        setSecs(15 * 60);
      }
    } else {
      setSecs(0);
    }
  };

  const toggleFocusModeDirectly = () => {
    const nextMode = config.focusMode === 'pomodoro' ? 'free' : 'pomodoro';
    setConfig(prev => ({ ...prev, focusMode: nextMode }));
    setRunning(false);
    setTimerType('focus');
    
    if (nextMode === 'pomodoro') {
      setSecs(config.focus * 60);
      setInitialPomodoroSecs(config.focus * 60);
    } else {
      setSecs(0);
    }
    
    triggerAlert(
      lang === 'pt' 
        ? `Modo de foco alterado para: ${nextMode === 'pomodoro' ? 'Pomodoro' : 'Livre'}` 
        : lang === 'en' 
          ? `Focus mode changed to: ${nextMode === 'pomodoro' ? 'Pomodoro' : 'Free'}` 
          : `Modo de enfoque cambiado a: ${nextMode === 'pomodoro' ? 'Pomodoro' : 'Libre'}`,
      "info"
    );
  };

  // Finish timer and prompt session ratings
  const handleFinishAndSave = () => {
    let elapsedSeconds = 0;
    if (config.focusMode === 'pomodoro') {
      elapsedSeconds = Math.max(0, (timerType === 'focus' ? config.focus * 60 : initialPomodoroSecs) - secs);
    } else {
      elapsedSeconds = secs;
    }

    if (elapsedSeconds < 5) {
      triggerAlert(t.alertTooShort, "info");
      return;
    }

    setRunning(false);
    setSessionSecsToSave(elapsedSeconds);
    // Open Focus Rating Recap Modal
    setShowRatingModal(true);
  };

  // Actual session save routine
  const commitSessionLog = () => {
    const rightNow = new Date();
    const newLog: FocusLog = {
      date: rightNow.toDateString(),
      dur: sessionSecsToSave,
      time: rightNow.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      rating: reviewRating,
      mode: timerType
    };

    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('rf_pro_logs', JSON.stringify(updatedLogs));
    
    // Close modal
    setShowRatingModal(false);
    resetTimer();

    const minutesString = (sessionSecsToSave / 60).toFixed(1);
    triggerAlert(t.alertSaved.replace("{minutesString}", minutesString), "success");

    // Automatically transition to Short Break if focus timer ended
    if (config.focusMode === 'pomodoro' && timerType === 'focus') {
      // Rotate break type
      const isFourthFocus = updatedLogs.filter(l => l.date === rightNow.toDateString() && l.mode === 'focus').length % 4 === 0;
      const nextBreakType = isFourthFocus ? 'longBreak' : 'shortBreak';
      
      setTimerType(nextBreakType);
      const minutesOfBreak = nextBreakType === 'shortBreak' ? 5 : 15;
      setSecs(minutesOfBreak * 60);
      setInitialPomodoroSecs(minutesOfBreak * 60);
      
      triggerAlert(
        lang === 'pt' 
          ? `Sessão de foco salva! Próximo passo: ${nextBreakType === 'shortBreak' ? t.shortBreak : t.longBreak}` 
          : `Focus recorded! Next up: ${nextBreakType === 'shortBreak' ? t.shortBreak : t.longBreak}`, 
        "info"
      );
    }
  };

  const handleClearHistory = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => {
        setConfirmClear(false);
      }, 4000);
      return;
    }
    setLogs([]);
    localStorage.setItem('rf_pro_logs', JSON.stringify([]));
    setConfirmClear(false);
    triggerAlert(t.alertHistReset, "info");
  };

  // Duration Formatter
  const formatMinutesSeconds = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Cumulative daily metrics
  function calculateDailyProgress() {
    const todayStr = new Date().toDateString();
    const totalTodaySecs = logs
      .filter(l => l.date === todayStr && l.mode !== 'shortBreak' && l.mode !== 'longBreak')
      .reduce((acc, curr) => acc + curr.dur, 0);
    
    const totalTodayHours = totalTodaySecs / 3600;
    const percentage = Math.min(100, Math.round((totalTodayHours / config.goal) * 100));
    return {
      hours: totalTodayHours.toFixed(2),
      percent: percentage,
      seconds: totalTodaySecs
    };
  }

  // Habits consecutive daily streaks calculation
  function calculateFocusStreak(allLogs: FocusLog[]): number {
    if (allLogs.length === 0) return 0;
    
    // Extract unique active days
    const focusDays = Array.from(new Set(
      allLogs
        .filter(l => l.mode !== 'break')
        .map(l => l.date)
    )).map(d => new Date(d));

    if (focusDays.length === 0) return 0;

    // Sort descending
    focusDays.sort((a, b) => b.getTime() - a.getTime());

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const hasLogTodayOrYesterday = focusDays.some(d => d.toDateString() === todayStr || d.toDateString() === yesterdayStr);
    if (!hasLogTodayOrYesterday) return 0;

    let currentStreak = 0;
    let checkDate = new Date(); // Start evaluating from today

    while (true) {
      const checkStr = checkDate.toDateString();
      const reachedDate = focusDays.some(d => d.toDateString() === checkStr);
      
      if (reachedDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1); // move 1 day back
      } else {
        // If there are logs today, but yesterday was missed, the streak is 1. Else 0.
        if (checkStr === new Date().toDateString()) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return currentStreak;
  }

  // Fullscreen container handler
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Task controllers
  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('taskText') as HTMLInputElement);
    const value = input.value.trim();
    if (!value) return;

    const newTask: Task = {
      id: Date.now(),
      text: value,
      done: false,
      starred: tasks.length === 0 ? true : false // star first task by default
    };

    setTasks([...tasks, newTask]);
    input.value = '';
    triggerAlert(t.alertTaskAdded, "success");
  };

  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleToggleStar = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, starred: !t.starred };
      }
      // Only one task can be starred at a time to keep focus highly selective
      return { ...t, starred: false };
    }));
    triggerAlert(lang === 'pt' ? 'Objetivo principal atualizado! ⭐' : lang === 'es' ? '¡Objetivo principal actualizado! ⭐' : 'Primary objective updated! ⭐', 'info');
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Preference configuration saving
  const handleSavePreferences = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const focusVal = parseInt((e.currentTarget.elements.namedItem('focusTime') as HTMLInputElement).value) || 25;
    const goalVal = parseFloat((e.currentTarget.elements.namedItem('goalTime') as HTMLInputElement).value) || 4;
    const modeVal = (e.currentTarget.elements.namedItem('focusModeOpt') as HTMLSelectElement).value as 'free' | 'pomodoro';
    const themeVal = (e.currentTarget.elements.namedItem('themeSelectorOpt') as HTMLSelectElement).value as 'violet' | 'emerald' | 'ocean' | 'amber';
    const breathVal = (e.currentTarget.elements.namedItem('breathGuideOpt') as HTMLInputElement).checked;

    setConfig(prev => ({
      ...prev,
      focus: focusVal,
      goal: goalVal,
      focusMode: modeVal,
      theme: themeVal,
      breathingActive: breathVal
    }));

    triggerAlert(t.alertPrefSaved, "success");
    setActiveTab('dash');
  };

  // Dynamic progress loader logic for Pomodoro
  const calculatePomodoroPercentage = () => {
    if (config.focusMode !== 'pomodoro') return 100;
    return Math.max(0, Math.min(100, (secs / initialPomodoroSecs) * 100));
  };

  const pPercent = calculatePomodoroPercentage();

  // IMMERSIVE FULL-SCREEN STATION
  if (isFullScreen) {
    return (
      <div 
        id="focus-app-root"
        ref={containerRef}
        className="app-wrapper flex flex-col justify-center items-center w-full min-h-screen bg-[#040409] px-6 py-12 relative overflow-hidden text-center select-none"
      >
        {/* Dynamic color-specific aurora background canvas */}
        <div 
          className={`absolute inset-0 bg-radial ${CTheme.bgGlow} via-[#040409]/0 pointer-events-none transition-all duration-1000 ${
            running ? 'scale-115 opacity-100 animate-pulse' : 'scale-100 opacity-60'
          }`} 
        />

        {/* Minimalized top metadata dashboard */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
            <span 
              className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide px-3.5 py-1.5 rounded-full border border-white/5 transition-all duration-300 ${
                timerType === 'focus' 
                  ? 'text-[#3dffa0] bg-[#102a1e]' 
                  : 'text-[#0ea5e9] bg-[#0ea5e9]/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-current animate-spin-slow" />
              <span>
                {timerType === 'focus' 
                  ? (config.focusMode === 'pomodoro' ? t.focusInProgress : t.freemode) 
                  : (timerType === 'shortBreak' ? t.shortBreak : t.longBreak)}
              </span>
            </span>

            {/* Streak flame indicator */}
            {calculatedStreak > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-[#ff5a5a] bg-[#ff5a5a]/10 px-3.5 py-1.5 rounded-full font-mono font-bold border border-[#ff5a5a]/10">
                <Flame className="w-4 h-4 fill-current" />
                <span>{calculatedStreak} {calculatedStreak === 1 ? 'Dia focado' : 'Dias seguidos'}</span>
              </span>
            )}
          </div>

          <button 
            type="button"
            onClick={toggleContainerFullscreen} 
            className="text-[#8b8ba8] hover:text-[#e2e2f0] transition-all bg-[#10101c] hover:bg-[#1c1c32] px-3.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-[#1c1c32] cursor-pointer outline-none"
          >
            <Minimize2 className="w-4 h-4 text-[#ff6b6b]" />
            <span>{lang === 'pt' ? 'Sair da Estação' : lang === 'es' ? 'Salir de Estación' : 'Exit Station'}</span>
          </button>
        </div>

        {/* Dynamic progress bar right under top margin */}
        {config.focusMode === 'pomodoro' && (
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#10101c]">
            <div 
              className="h-full bg-gradient-to-r from-[#6c63ff] via-[#3dffa0] to-[#bf5eff] transition-all duration-500"
              style={{ width: `${pPercent}%`, backgroundColor: CTheme.primary }}
            />
          </div>
        )}

        <div className="flex flex-col items-center justify-center max-w-xl w-full z-10 gap-6">
          {/* Render Starred Task right in front screen as anchor */}
          {starredTask ? (
            <div className="flex flex-col items-center gap-1 mb-1">
              <span className={`text-[10px] tracking-[0.2em] uppercase font-bold font-mono opacity-60 ${CTheme.textColor}`}>
                {t.primaryGoalLabel}
              </span>
              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 py-1.5 px-4 rounded-xl shadow-lg">
                <Star className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                <span className="text-white text-xs md:text-sm font-semibold max-w-[320px] truncate">
                  {starredTask.text}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] tracking-[0.3em] text-[#52526e] uppercase font-bold font-mono">
              {running ? t.focusInProgress : t.sessionReady}
            </div>
          )}

          {/* LARGE ERGONOMIC CHRONO TIMER */}
          <div 
            id="chrono-display-fs"
            className={`font-mono font-bold leading-none select-all transition-all duration-700 origin-center ${
              running ? 'scale-102 active-flick' : 'text-[#e2e2f0]'
            }`}
            style={{ 
              fontSize: 'clamp(6rem, 18vw, 11rem)', 
              color: running ? CTheme.primary : '#e2e2f0',
              textShadow: running ? `0 0 40px ${CTheme.shadowGlow}` : 'none' 
            }}
          >
            {formatMinutesSeconds(secs)}
          </div>

          {/* PULSING COMPASS BREATH PACE GUIDE INSIDE FULLSCREEN */}
          {config.breathingActive && (
            <div className="flex flex-col items-center gap-1 animate-fadeIn">
              <div 
                className="flex items-center justify-center rounded-full border border-white/10 transition-all duration-1000 origin-center"
                style={{
                  width: '64px',
                  height: '64px',
                  transform: breathPhase === 'inhale' ? 'scale(0.85)' : breathPhase === 'hold' ? 'scale(1.0)' : breathPhase === 'exhale' ? 'scale(0.68)' : 'scale(0.75)',
                  borderColor: CTheme.primary,
                  boxShadow: `0 0 20px ${CTheme.shadowGlow}`
                }}
              >
                <Wind className="w-4 h-4" style={{ color: CTheme.primary }} />
              </div>
              <span className="text-[10px] font-mono tracking-wider opacity-90 mt-1" style={{ color: CTheme.primary }}>
                {breathPhase === 'inhale' ? t.breathInhale : breathPhase === 'hold' ? t.breathHold : breathPhase === 'exhale' ? t.breathExhale : t.breathHoldEx} ({breathSecs}s)
              </span>
            </div>
          )}

          {/* TRANSITIONAL MOTIVATIONAL QUOTE BANNER */}
          <div className="quote-box min-h-[95px] flex flex-col justify-center items-center py-1 px-4 max-w-[92%] select-none relative transition-all duration-500">
            <p 
              className={`text-sm sm:text-base md:text-lg italic text-[#e2e2f0]/95 leading-relaxed transition-opacity duration-500 max-w-[95%] ${
                quoteFade ? 'opacity-100' : 'opacity-0'
              }`}
            >
              "{quotesByLang[lang][currentQuoteIndex].text}"
            </p>
            <span 
              className="text-[10px] sm:text-xs font-mono font-medium tracking-wider uppercase mt-2.5 transition-opacity duration-500"
              style={{ color: CTheme.primary }}
            >
              {quotesByLang[lang][currentQuoteIndex].author}
            </span>
          </div>

          {/* CONTROLLER ICON BUTTONS */}
          <div className="flex gap-6 justify-center items-center mt-3">
            <button 
              onClick={resetTimer} 
              title={t.resetBtn}
              className="w-13 h-13 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#e2e2f0] hover:bg-[#1a1c32] flex items-center justify-center cursor-pointer transition-all duration-200 outline-none"
              style={{ hoverBorderColor: CTheme.primary }}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            
            <button 
              onClick={toggleTimer} 
              title={running ? t.pauseBtn : t.startBtn}
              className="w-20 h-20 rounded-full text-white hover:scale-105 flex items-center justify-center cursor-pointer transition-all duration-200 outline-none"
              style={{ 
                backgroundColor: CTheme.primary,
                boxShadow: `0 0 25px ${CTheme.shadowGlowHeavy}`
              }}
            >
              {running ? <Pause className="w-9 h-9 fill-current" /> : <Play className="w-9.5 h-9.5 ml-1 fill-current" />}
            </button>

            <button 
              onClick={handleFinishAndSave} 
              title={t.saveBtn}
              className="w-13 h-13 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#3dffa0] hover:bg-[#102a1e] flex items-center justify-center cursor-pointer transition-all duration-200 outline-none"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FLOATING ACTION ALERTS */}
        {alertMsg && (
          <div 
            className={`absolute bottom-8 flex items-center gap-3 p-3 px-5 rounded-full border text-xs font-semibold animate-fadeIn z-30 ${
              alertMsg.type === 'success' 
                ? 'bg-[#102a1e] border-[#3dffa0]/40 text-[#3dffa0]' 
                : 'bg-[#1a102d] border-[#6c63ff]/40 text-[#d4b9ff]'
            }`}
          >
            {alertMsg.type === 'success' ? <Award className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      id="focus-app-root"
      ref={containerRef}
      className={`app-wrapper flex flex-col justify-start w-full min-h-screen max-w-[500px] mx-auto px-4 py-8 relative transition-all duration-500 bg-transparent ${
        config.activeZen ? 'py-12' : ''
      }`}
    >
      {/* STATIC OUT-OF-IFRAME CHRONIC GLOW BACKGROUND */}
      <div 
        className={`absolute inset-0 bg-radial ${CTheme.bgGlow} via-black/0 pointer-events-none -z-10 transition-all duration-1000 ${
          running ? 'scale-110 opacity-70' : 'scale-90 opacity-30'
        }`} 
      />

      {/* HEADER SECTION (HIDDEN IN MINIMAL ZEN MODE) */}
      {!config.activeZen && (
        <header id="app-header" className="flex flex-col gap-3 mb-6 border-b border-[#1c1c32]/40 pb-4 animate-fadeIn">
          <div className="flex justify-between items-center w-full">
            <div>
              <h1 
                className="logo font-mono text-sm tracking-[0.2em] font-bold uppercase transition-all duration-300 cursor-pointer" 
                style={{ color: CTheme.primary }}
                onClick={() => setActiveTab('dash')}
              >
                ⬡ RelogioFoco
              </h1>
              <p className="text-[10px] text-[#52526e] tracking-wider mt-1 font-mono uppercase">{t.subtitle}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xs font-semibold text-[#8b8ba8] flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5" style={{ color: CTheme.primary }} />
                {currentDateString || t.noConn}
              </div>
              <div className="text-[10px] text-[#52526e] mt-1 font-mono">
                {t.goal}: {dailyStats.hours}h {t.of} {config.goal}h ({dailyStats.percent}%)
              </div>
            </div>
          </div>

          {/* Quick Stats Highlights */}
          <div className="flex justify-between items-center w-full pt-1.5">
            {calculatedStreak > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-[#ff5a5a] bg-[#ff5a5a]/5 px-2 py-0.5 rounded-md font-bold">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{calculatedStreak} {calculatedStreak === 1 ? 'Dia focado' : 'Dias seguidos'}</span>
              </span>
            )}
            {dailyStats.percent >= 100 && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#3dffa0] bg-[#102a1e] px-2 py-0.5 rounded-md font-bold">
                🏆 METAS DO DIA BATIDAS!
              </span>
            )}
          </div>

          {/* Language selection controller */}
          <div className="flex justify-between items-center w-full pt-2 border-t border-[#1c1c32]/10">
            <span className="text-[9px] font-mono text-[#52526e] uppercase tracking-wider">Language / Idioma</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLang('pt')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all duration-200 uppercase font-bold cursor-pointer ${lang === 'pt' ? 'text-white shadow' : 'bg-[#10101c] text-[#52526e] hover:text-[#8b8ba8] border border-[#1c1c32]/60'}`}
                style={{ backgroundColor: lang === 'pt' ? CTheme.primary : '' }}
              >
                🇧🇷 PT
              </button>
              <button
                onClick={() => setLang('en')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all duration-200 uppercase font-bold cursor-pointer ${lang === 'en' ? 'text-white shadow' : 'bg-[#10101c] text-[#52526e] hover:text-[#8b8ba8] border border-[#1c1c32]/60'}`}
                style={{ backgroundColor: lang === 'en' ? CTheme.primary : '' }}
              >
                🇺🇸 EN
              </button>
              <button
                onClick={() => setLang('es')}
                className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all duration-200 uppercase font-bold cursor-pointer ${lang === 'es' ? 'text-white shadow' : 'bg-[#10101c] text-[#52526e] hover:text-[#8b8ba8] border border-[#1c1c32]/60'}`}
                style={{ backgroundColor: lang === 'es' ? CTheme.primary : '' }}
              >
                🇪🇸 ES
              </button>
            </div>
          </div>
        </header>
      )}

      {/* FLOATING ACTION ALERTS - Out of flow to prevent any grid or layout shift */}
      {alertMsg && (
        <div 
          id="status-alert"
          className={`fixed top-6 left-1/2 -translate-x-1/2 max-w-[420px] w-[90%] flex items-center gap-3 p-3.5 rounded-xl border text-xs font-semibold shadow-[0_12px_44px_rgba(0,0,0,0.7)] animate-fadeIn z-50 pointer-events-none transition-all duration-300 ${
            alertMsg.type === 'success' 
              ? 'bg-[#102a1e] border-[#3dffa0]/50 text-[#3dffa0]' 
              : 'bg-[#1a102d] text-[#d4b9ff]'
          }`}
          style={{ borderColor: alertMsg.type !== 'success' ? `${CTheme.primary}50` : '' }}
        >
          {alertMsg.type === 'success' ? <Award className="w-4 h-4 shrink-0 text-[#3dffa0]" /> : <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" style={{ color: CTheme.primary }} />}
          <span className="flex-grow">{alertMsg.text}</span>
        </div>
      )}

      {/* DYNAMIC ZEN BANNER TO QUICK EXIT IN HYPER-MINIMAL MODE */}
      {config.activeZen && (
        <button 
          onClick={() => setConfig(prev => ({ ...prev, activeZen: false }))}
          className="w-full flex items-center justify-between bg-black/50 border border-white/5 px-4 py-2.5 rounded-xl mb-4 text-[#8b8ba8] hover:text-white text-[10px] font-mono tracking-wide uppercase transition-all duration-300"
        >
          <span className="flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" style={{ color: CTheme.primary }} />
            {t.activeZenLabel}
          </span>
          <span className="text-[9px] opacity-75" style={{ color: CTheme.primary }}>[ {t.backToFocus} / Sair Zen ]</span>
        </button>
      )}

      {/* PRIMARY NAVIGATION TABS (HIDDEN IN ZEN MODE) */}
      {!config.activeZen && (
        <nav id="navigation-tabs" className="nav-tabs grid grid-cols-4 bg-[#10101c] border border-[#1c1c32] p-1 rounded-[16px] mb-6 shadow-xl relative z-10 select-none">
          <button 
            id="btn-nav-dash"
            className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'dash' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
            onClick={() => setActiveTab('dash')}
          >
            <Clock className="w-4 h-4" />
            <span>{t.tabDash}</span>
          </button>
          <button 
            id="btn-nav-tasks"
            className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'tasks' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
            onClick={() => setActiveTab('tasks')}
          >
            <div className="relative">
              <CheckSquare className="w-4 h-4" />
              {tasks.filter(t => !t.done).length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#ff6b6b] text-white font-sans text-[8px] px-1 rounded-full">
                  {tasks.filter(t => !t.done).length}
                </span>
              )}
            </div>
            <span>{t.tabTasks}</span>
          </button>
          <button 
            id="btn-nav-logs"
            className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'logs' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
            onClick={() => setActiveTab('logs')}
          >
            <div className="relative">
              <History className="w-4 h-4" />
              {logs.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#3dffa0] text-black font-sans text-[8px] px-1 font-bold rounded-full">
                  {logs.length}
                </span>
              )}
            </div>
            <span>{t.tabLogs}</span>
          </button>
          <button 
            id="btn-nav-config"
            className={`nav-item py-2 text-[11px] uppercase font-bold tracking-wider rounded-[11px] transition-all duration-200 cursor-pointer flex flex-col items-center gap-1 ${activeTab === 'config' ? 'bg-[#1c1c32] text-white shadow-inner' : 'text-[#52526e] hover:text-[#8b8ba8]'}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings className="w-4 h-4" />
            <span>{t.tabConfig}</span>
          </button>
        </nav>
      )}

      {/* MAIN CONTAINER CONTROLLING THE SEVERAL VIEWS */}
      <main id="main-content" className="flex-grow">

        {/* TAB 1: DASHBOARD VIEW */}
        <div id="tab-view-dash" className={`view ${activeTab === 'dash' ? 'active block' : 'hidden'}`}>
          
          {/* HERO TAGLINE - Explains purpose in a premium, elegant way */}
          <div 
            id="hero-tagline"
            className={`transition-all duration-500 ease-in-out ${
              config.activeZen || isFullScreen 
                ? 'opacity-0 max-h-0 pointer-events-none mb-0 overflow-hidden' 
                : 'opacity-100 max-h-[120px] mb-5'
            }`}
          >
            <div className="bg-[#10101c]/40 border border-[#1c1c32]/30 backdrop-blur-md rounded-2xl p-4 text-center">
              <p className="text-xs leading-relaxed text-[#8b8ba8] font-sans">
                {lang === 'pt' && (
                  <>
                    <strong className="text-white font-semibold">Sua Estação de Foco.</strong> Combine a técnica Pomodoro com áudio orgânico 3D e guias de respiração para alcançar o estado de fluxo.
                  </>
                )}
                {lang === 'en' && (
                  <>
                    <strong className="text-white font-semibold">Your Focus Station.</strong> Combine the Pomodoro technique with organic 3D audio and breathing guides to reach the flow state.
                  </>
                )}
                {lang === 'es' && (
                  <>
                    <strong className="text-white font-semibold">Tu Estación de Enfoque.</strong> Combina la técnica Pomodoro con audio orgánico 3D y guías de respiración para alcanzar el estado de flujo.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="clock-card bg-[#10101c] border border-[#1c1c32] rounded-[28px] p-6 text-center relative shadow-2xl overflow-hidden transition-all duration-300">
            
            {/* Color-themed glowing status bar */}
            {config.focusMode === 'pomodoro' && (
              <div 
                id="pmo-progress-bar" 
                className="absolute top-0 left-0 h-[3px] transition-all duration-500"
                style={{ width: `${pPercent}%`, backgroundColor: CTheme.primary }}
              />
            )}

            {/* Micro-actions buttons row inside Clock card */}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={toggleFocusModeDirectly}
                  title={lang === 'pt' ? 'Clique para alternar de formato (Livre ou Pomodoro)' : lang === 'es' ? 'Haga clic para cambiar formato (Libre o Pomodoro)' : 'Click to toggle format (Free or Pomodoro)'}
                  className="flex items-center gap-1 text-[10px] bg-[#102a1e] hover:scale-103 active:scale-97 px-2.5 py-1 rounded-full font-mono uppercase tracking-wide cursor-pointer transition-all duration-200 border border-white/5 select-none outline-none"
                  style={{ color: CTheme.primary }}
                >
                  <Sparkles className="w-3 h-3 text-current" />
                  {timerType === 'focus' 
                    ? (config.focusMode === 'pomodoro' ? t.pmodo : t.freemode)
                    : (timerType === 'shortBreak' ? t.shortBreak : t.longBreak)}
                </button>

                {/* Zen eye button inside card */}
                <button 
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, activeZen: !prev.activeZen }))}
                  title={t.activeZenLabel}
                  className="flex items-center justify-center p-1 bg-[#1a1a2e]/50 text-gray-500 hover:text-white hover:scale-105 active:scale-95 rounded-lg cursor-pointer transition-all border border-white/5"
                >
                  {config.activeZen ? <Eye className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>


              </div>

              <button 
                id="btn-fullscreen"
                title="Alternar Estação Completa"
                onClick={toggleContainerFullscreen} 
                className="text-[#52526e] hover:text-[#e2e2f0] transition-colors p-1"
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4 animate-ping" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Pinned starred core task display */}
            {starredTask ? (
              <div className="flex flex-col items-center justify-center my-3 py-1 bg-black/20 border border-white/[0.03] rounded-xl tracking-tight transition-all">
                <div className="flex items-center gap-1.5 select-none">
                  <Star className="w-3 h-3 text-amber-400 fill-current animate-spin-slow" />
                  <span className="text-[9px] font-mono uppercase text-[#8b8ba8] tracking-wider">{t.primaryGoalLabel}</span>
                </div>
                <p className="text-xs font-semibold text-white mt-0.5 truncate max-w-[280px]">
                  {starredTask.text}
                </p>
              </div>
            ) : (
              <div className="text-[10px] tracking-[0.2em] text-[#52526e] uppercase font-semibold my-3 font-mono">
                {timerType === 'focus' 
                  ? (running ? t.focusInProgress : t.sessionReady) 
                  : t.breakInProgress}
              </div>
            )}

            {/* BIG CHRONO DISPLAY (Flickering and styled with neon glow when active) */}
            <div 
              id="chrono-display" 
              className={`display font-mono font-bold leading-none select-all transition-all duration-300 origin-center ${
                running ? 'scale-105 active-flick' : 'text-[#e2e2f0]'
              }`}
              style={{ 
                fontSize: 'clamp(4.2rem, 16vw, 6.2rem)', 
                color: running ? CTheme.primary : '#e2e2f0',
                textShadow: running ? `0 0 20px ${CTheme.shadowGlow}` : 'none' 
              }}
            >
              {formatMinutesSeconds(secs)}
            </div>

            {/* INTERACTIVE COMPASS PACER BREATH CIRCLE */}
            {config.breathingActive && (
              <div className="flex flex-col items-center justify-center mt-4 mb-2 animate-fadeIn animate-duration-1000">
                <div 
                  className="flex items-center justify-center bg-white/[0.01] rounded-full border border-white/5 transition-all duration-1000 origin-center"
                  style={{
                    width: '60px',
                    height: '60px',
                    transform: breathPhase === 'inhale' ? 'scale(0.83)' : breathPhase === 'hold' ? 'scale(1.0)' : breathPhase === 'exhale' ? 'scale(0.66)' : 'scale(0.73)',
                    borderColor: CTheme.primary,
                    boxShadow: running ? `0 0 15px ${CTheme.shadowGlow}` : 'none'
                  }}
                >
                  <Wind className="w-3.5 h-3.5 stroke-[1.5px]" style={{ color: CTheme.primary }} />
                </div>
                <span className="text-[9px] font-mono tracking-wider opacity-85 mt-1" style={{ color: CTheme.primary }}>
                  {breathPhase === 'inhale' ? t.breathInhale : breathPhase === 'hold' ? t.breathHold : breathPhase === 'exhale' ? t.breathExhale : t.breathHoldEx} ({breathSecs}s)
                </span>
              </div>
            )}

            <div className="my-1 border-b border-[#1c1c32]/40" />

            {/* ROTATING MOTIVATIONAL QUOTES */}
            <div className="quote-box min-h-[96px] flex flex-col justify-center items-center py-1 select-none relative">
              <p 
                id="quote-text" 
                className={`text-xs italic text-[#e2e2f0] leading-relaxed transition-opacity duration-500 max-w-[92%] ${
                  quoteFade ? 'opacity-100' : 'opacity-0'
                }`}
              >
                "{quotesByLang[lang][currentQuoteIndex].text}"
              </p>
              <span 
                id="quote-author" 
                className="text-[9px] font-mono font-medium tracking-wider uppercase mt-1 transition-opacity duration-500"
                style={{ color: CTheme.primary }}
              >
                {quotesByLang[lang][currentQuoteIndex].author}
              </span>
            </div>

            {/* BUTTON CONTROLLER RINGS */}
            <div className="flex gap-4 justify-center items-center mt-3">
              <button 
                id="btn-reset-timer"
                onClick={resetTimer} 
                title={t.resetBtn}
                className="btn-sec w-11 h-11 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#e2e2f0] hover:bg-[#1c1c32] flex items-center justify-center cursor-pointer transition-all duration-200 outline-none hover:border-[#6c63ff]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button 
                id="btn-trigger-timer"
                onClick={toggleTimer} 
                title={running ? t.pauseBtn : t.startBtn}
                className="btn-main w-16 h-16 rounded-full text-white hover:scale-105 flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none"
                style={{ 
                  backgroundColor: CTheme.primary,
                  boxShadow: `0 0 15px ${CTheme.shadowGlow}` 
                }}
              >
                {running ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8.5 h-8.5 ml-1 fill-current" />}
              </button>

              <button 
                id="btn-finish-timer"
                onClick={handleFinishAndSave} 
                title={t.saveBtn}
                className="btn-sec w-11 h-11 rounded-full border border-[#1c1c32] bg-[#10101c] text-[#52526e] hover:text-[#3dffa0] hover:bg-[#1c1c32] flex items-center justify-center cursor-pointer transition-all duration-200 outline-none hover:border-[#3dffa0]"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GOOGLE ADS SENSE PLACEHOLDER (HIDDEN IN HYPER CALM MODE) */}
          {!config.activeZen && (
            <div className="ad-slot my-4 min-h-[75px] bg-[#10101c] border border-dashed border-[#1c1c32] rounded-2xl flex flex-col items-center justify-center text-center p-3 animate-fadeIn">
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#52526e] mb-1">
                {lang === 'pt' ? 'Publicidade (Google AdSense)' : lang === 'es' ? 'Publicidad (Google AdSense)' : 'Advertisement (Google AdSense)'}
              </span>
              <span className="text-[10px] text-[#8b8ba8]">
                {lang === 'pt' ? 'Anúncio Responsivo Integrado' : lang === 'es' ? 'Anuncio Responsivo Integrado' : 'Integrated Responsive Banner'}
              </span>
            </div>
          )}

          {/* QUICK CHROME NATURE SHORTCUT ACOUSTIC PRESETS */}
          <div className="mixer-card bg-[#10101c] border border-[#1c1c32] rounded-2xl p-4.5 shadow-lg mb-4">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#52526e] font-mono font-bold block mb-3">
              🌿 {t.presetsLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => applyAudioPreset('storm')}
                className="text-[10.5px] text-[#e2e2f0] border border-[#1c1c32] bg-[#0c0c16] hover:bg-[#151528] py-2 px-1 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-medium"
              >
                <span>⛈️</span>
                <span>{t.presetStorm}</span>
              </button>
              <button 
                onClick={() => applyAudioPreset('forest')}
                className="text-[10.5px] text-[#e2e2f0] border border-[#1c1c32] bg-[#0c0c16] hover:bg-[#151528] py-2 px-1 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-medium"
              >
                <span>🏕️</span>
                <span>{t.presetForest}</span>
              </button>
              <button 
                onClick={() => applyAudioPreset('ocean')}
                className="text-[10.5px] text-[#e2e2f0] border border-[#1c1c32] bg-[#0c0c16] hover:bg-[#151528] py-2 px-1 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-medium"
              >
                <span>🪐</span>
                <span>{t.presetOcean}</span>
              </button>
              <button 
                onClick={() => applyAudioPreset('cafe')}
                className="text-[10.5px] text-[#e2e2f0] border border-[#1c1c32] bg-[#0c0c16] hover:bg-[#151528] py-2 px-1 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-medium"
              >
                <span>☕</span>
                <span>{t.presetCafe}</span>
              </button>
              <button 
                onClick={() => applyAudioPreset('mute')}
                className="col-span-2 text-[10.5px] text-red-400 border border-red-500/10 bg-[#160c0c] hover:bg-[#281515] py-2 px-1 rounded-xl flex items-center gap-1.5 justify-center transition-all cursor-pointer font-medium"
              >
                <span>🔇</span>
                <span>{t.presetMute}</span>
              </button>
            </div>
          </div>

          {/* INTERACTIVE AMBIENT SOUND MIXER */}
          <section id="audio-mixer" className="mixer-card bg-[#10101c] border border-[#1c1c32] rounded-2xl p-4.5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="mixer-title text-[10px] uppercase tracking-[0.15em] text-[#52526e] font-mono font-bold">
                {t.ambientSoundsTitle}
              </span>
              <Volume2 className="w-3.5 h-3.5" style={{ color: CTheme.primary }} />
            </div>

            <div className="flex justify-around items-center pt-2 pb-1 gap-2 flex-wrap sm:flex-nowrap">
              <Knob 
                value={volumeRain}
                onChange={(val) => handleVolumeChange('rain', val)}
                label={t.rain}
                icon="🌧"
                color={CTheme.primary}
                glowColor={CTheme.shadowGlow}
              />
              <Knob 
                value={volumeForest}
                onChange={(val) => handleVolumeChange('forest', val)}
                label={t.forest}
                icon="🌿"
                color={CTheme.primary}
                glowColor={CTheme.shadowGlow}
              />
              <Knob 
                value={volumeWhite}
                onChange={(val) => handleVolumeChange('white', val)}
                label={t.noise}
                icon="🌊"
                color={CTheme.primary}
                glowColor={CTheme.shadowGlow}
              />
            </div>
            
            <p className="text-[9px] text-[#52526e] text-center mt-3 font-mono">
              {t.webaudioNotice}
            </p>
          </section>

          {/* REAL-TIME AUDIO COMPASS FREQUENCY VISUALIZER (HIDDEN IN HYPER CALM MODE) */}
          {!config.activeZen && <AudioVisualizer theme={activeThemeKey} />}
        </div>

        {/* TAB 2: TASKS VIEW */}
        <div id="tab-view-tasks" className={`view ${activeTab === 'tasks' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-3.5 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" style={{ color: CTheme.primary }} />
              {t.focusTitle}
            </h3>

            {/* Simple explanatory pin label */}
            <p className="text-[10px] text-[#52526e] font-mono mb-3.5 select-all">
              🔔 {t.pressToPin}
            </p>

            {/* QUICK FORM TO ADD TASKS */}
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input 
                type="text" 
                name="taskText"
                placeholder={t.addTaskPlaceholder} 
                autoComplete="off"
                className="flex-grow bg-[#080810] border border-[#1c1c32] p-3 text-sm text-white rounded-xl placeholder-[#52526e] focus:outline-none focus:border-[#6c63ff] transition-all"
                style={{ focusBorderColor: CTheme.primary }}
              />
              <button 
                type="submit"
                title={t.addTaskTooltip}
                className="text-white p-3 rounded-xl font-bold cursor-pointer hover:scale-103 transition-all flex items-center justify-center shrink-0 w-11 focus:outline-none"
                style={{ backgroundColor: CTheme.primary }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* DYNAMIC TASKS GENERATED FROM LOCAL OR DEFAULT STATE */}
            <div id="task-list" className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#52526e] font-mono bg-[#080810]/40 rounded-xl border border-[#1c1c32]/50">
                  {t.noTasks}
                </div>
              ) : (
                tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`task-item bg-[#080810] border p-3.5 rounded-xl flex items-center gap-3 transition-opacity duration-200 ${
                      task.done ? 'border-[#1c1c32] opacity-50' : 'border-[#1c1c32] hover:border-white/10'
                    }`}
                  >
                    <button 
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors focus:outline-none cursor-pointer ${
                        task.done ? 'bg-[#3dffa0] border-[#3dffa0]' : 'border-[#52526e] hover:border-white/25'
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

                    {/* Star pin toggle button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStar(task.id)}
                      className={`p-1.5 transition-colors focus:outline-none cursor-pointer`}
                      title={t.primaryGoalLabel}
                    >
                      <Star 
                        className={`w-4 h-4 transition-all duration-300 ${
                          task.starred ? 'text-amber-400 fill-current scale-110' : 'text-gray-600 hover:text-amber-400'
                        }`} 
                      />
                    </button>

                    <button 
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      title={t.deleteTaskTooltip}
                      className="btn-del p-1 text-[#ff6b6b]/60 hover:text-[#ff6b6b] transition-colors focus:outline-none cursor-pointer"
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
                <History className="w-4 h-4" style={{ color: CTheme.primary }} />
                {t.historyTitle}
              </h3>
              <div className="text-[10px] bg-[#1c1c32] px-2.5 py-1 rounded-md text-[#8b8ba8] font-mono">
                {logs.length} {logs.length === 1 ? t.record : t.records}
              </div>
            </div>

            {/* Daily stats board */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#080810] border border-[#1c1c32] rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#52526e] font-mono block uppercase">{t.focusTimeLog}</span>
                <span className="text-base font-bold text-[#3dffa0] font-mono mt-0.5 block">{dailyStats.hours} {t.hoursText}</span>
              </div>
              <div className="bg-[#080810] border border-[#1c1c32] rounded-xl p-3 text-center">
                <span className="text-[10px] text-[#52526e] font-mono block uppercase">{t.targetCompleted}</span>
                <span className="text-base font-bold font-mono mt-0.5 block" style={{ color: CTheme.primary }}>{dailyStats.percent}%</span>
              </div>
            </div>

            {/* Milestone Congrats Band */}
            {dailyStats.percent >= 100 && (
              <div className="p-3 bg-[#102a1e] border border-[#3dffa0]/30 rounded-xl mb-4 text-center text-xs text-[#3dffa0] font-semibold flex items-center justify-center gap-1.5 animate-bounce">
                <Award className="w-4 h-4 fill-current shrink-0 animate-spin-slow" />
                <span>{t.milestoneAchieved}</span>
              </div>
            )}

            <div id="hist-list" className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#52526e] font-mono bg-[#080810]/40 rounded-xl border border-[#1c1c32]/50 whitespace-pre-line leading-relaxed">
                  {t.noLogs}
                </div>
              ) : (
                logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center bg-[#080810] border border-[#1c1c32] p-3 rounded-xl leading-relaxed"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {log.mode === 'shortBreak' || log.mode === 'longBreak' ? t.breakInProgress.replace('☕', '') : (lang === 'pt' ? 'Sessão Foco' : 'Focus Session')}
                        </span>
                        
                        {/* Star rate stars render inside logs list */}
                        {log.rating && (
                          <div className="flex items-center text-amber-400 gap-0.5 text-[10px]">
                            {Array.from({ length: log.rating }).map((_, rIdx) => (
                              <Star key={rIdx} className="w-2.5 h-2.5 fill-current" />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-[#52526e] font-mono">{log.time} • {log.date}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-[#3dffa0]">
                        {formatMinutesSeconds(log.dur)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {logs.length > 0 && (
              <button 
                id="btn-clear-history"
                onClick={handleClearHistory}
                className={`w-full mt-4 py-2 bg-transparent text-[10px] uppercase tracking-wider font-mono cursor-pointer transition-all focus:outline-none border border-dashed rounded-xl ${
                  confirmClear 
                    ? 'border-[#ff6b6b] text-[#ff6b6b] bg-[#ff6b6b]/10 animate-pulse' 
                    : 'border-[#1c1c32] text-[#ff6b6b]/60 hover:text-[#ff6b6b]'
                }`}
              >
                {confirmClear ? t.clearLogsWarning : t.clearLogsBtn}
              </button>
            )}
          </div>
        </div>

        {/* TAB 4: CONFIGURATION ARCHITECTURE VIEW */}
        <div id="tab-view-config" className={`view ${activeTab === 'config' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-4.5 flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: CTheme.primary }} />
              {t.configTitle}
            </h3>

            <form onSubmit={handleSavePreferences} className="space-y-4 font-sans text-sm">
              
              {/* Theme Settings Selector */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{t.themeLabel}</span>
                  <span className="text-[10px] text-[#52526e]">Estética dos botões e leds</span>
                </div>
                <select 
                  name="themeSelectorOpt" 
                  defaultValue={config.theme || 'violet'}
                  className="bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs font-bold rounded-lg focus:outline-none outline-none text-white font-mono"
                >
                  <option value="violet">{lang === 'pt' ? 'Roxo Cósmico' : 'Cosmic Violet'}</option>
                  <option value="emerald">{lang === 'pt' ? 'Verde Floresta' : 'Forest Emerald'}</option>
                  <option value="ocean">{lang === 'pt' ? 'Azul Oceânico' : 'Deep Oceanic'}</option>
                  <option value="amber">{lang === 'pt' ? 'Entardecer Quente' : 'Sunset Amber'}</option>
                </select>
              </div>

              {/* Breathing Guide Settings Switch toggle */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{t.breathingGuide}</span>
                  <span className="text-[10px] text-[#52526e]">Led concêntrico para relaxar</span>
                </div>
                <input 
                  type="checkbox" 
                  name="breathGuideOpt" 
                  defaultChecked={config.breathingActive}
                  className="w-4 h-4 rounded cursor-pointer border-[#1c1c32] text-[#6c63ff] focus:ring-0 focus:outline-none"
                  style={{ accentColor: CTheme.primary }}
                />
              </div>

              {/* Focus timer Mode toggle options selector */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{t.timingMode}</span>
                  <span className="text-[10px] text-[#52526e]">{t.timingDesc}</span>
                </div>
                <select 
                  name="focusModeOpt" 
                  defaultValue={config.focusMode}
                  className="bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs font-bold rounded-lg focus:outline-none outline-none font-mono"
                  style={{ color: CTheme.primary }}
                >
                  <option value="pomodoro">{t.pomodoroOption}</option>
                  <option value="free">{t.freeOption}</option>
                </select>
              </div>

              {/* Goal daily target settings input */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{t.dailyGoal}</span>
                  <span className="text-[10px] text-[#52526e]">{t.dailyGoalDesc}</span>
                </div>
                <input 
                  type="number" 
                  name="goalTime" 
                  min="0.5" 
                  max="24" 
                  step="0.5"
                  defaultValue={config.goal}
                  className="w-16 bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs text-center font-bold rounded-lg focus:outline-none text-white font-mono"
                />
              </div>

              {/* Focus target minutes */}
              <div className="flex justify-between items-center bg-[#080810] p-3 rounded-xl border border-[#1c1c32]">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{t.pomodoroFocusMin}</span>
                  <span className="text-[10px] text-[#52526e]">{t.pomodoroFocusDesc}</span>
                </div>
                <input 
                  type="number" 
                  name="focusTime" 
                  min="1" 
                  max="240"
                  defaultValue={config.focus}
                  className="w-16 bg-[#10101c] border border-[#1c1c32] p-1.5 text-xs text-center font-bold rounded-lg focus:outline-none text-white font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3 text-white rounded-xl text-xs font-bold tracking-wider uppercase cursor-pointer hover:opacity-90 transition-colors focus:outline-none"
                style={{ backgroundColor: CTheme.primary }}
              >
                {t.savePreferences}
              </button>
            </form>
          </div>
        </div>

        {/* INLINE VIEW: PRIVACY POLICIES AND TERMS */}
        <div id="tab-view-privacy" className={`view ${activeTab === 'privacy' ? 'active block' : 'hidden'}`}>
          <div className="bg-[#10101c] border border-[#1c1c32] rounded-2xl p-5 shadow-lg mb-4">
            <h3 className="text-sm font-bold tracking-wide text-white mb-3.5 flex items-center gap-2">
              {t.privacyHeading}
            </h3>
            <div className="text-[11px] text-[#8b8ba8] leading-relaxed space-y-4 max-h-[320px] overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 font-mono text-[#6c63ff]" style={{ color: CTheme.primary }}>
                  {privacyContent[lang].t1}
                </h4>
                <p>
                  {privacyContent[lang].p1}
                </p>
                <div className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-[#8b8ba8]">
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li1_1}</div></div>
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li1_2}</div></div>
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li1_3}</div></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 font-mono text-[#6c63ff]" style={{ color: CTheme.primary }}>
                  {privacyContent[lang].t2}
                </h4>
                <p>
                  {privacyContent[lang].p2}
                </p>
                <div className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-[#8b8ba8]">
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li2_1}</div></div>
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li2_2}</div></div>
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li2_3}</div></div>
                  <div className="flex gap-2"><span>•</span><div>{privacyContent[lang].li2_4}</div></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 font-mono text-[#6c63ff]" style={{ color: CTheme.primary }}>
                  {privacyContent[lang].t3}
                </h4>
                <p>
                  {privacyContent[lang].p3}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dash')}
              className="w-full mt-4 py-2.5 text-white rounded-xl text-xs font-bold transition-opacity hover:opacity-95 focus:outline-none cursor-pointer text-center"
              style={{ backgroundColor: CTheme.primary }}
            >
              {t.privacyButton}
            </button>
          </div>
        </div>

      </main>

      {/* RECAP MODAL DIALOGUE WHEN CONCLUDING POMODORO SESSIONS */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#12121e] border border-[#1c1c32] rounded-[24px] p-6 max-w-sm w-full text-center shadow-2xl relative">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${CTheme.primary}15` }}>
              <Activity className="w-6 h-6" style={{ color: CTheme.primary }} />
            </div>

            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1 font-mono">{t.ratingTitle}</h3>
            <p className="text-[11px] text-gray-500 mb-4">Como foi sua absorção de foco nesta sessão de {formatMinutesSeconds(sessionSecsToSave)} minutos?</p>

            {/* Clickable interactive Star ratings picker */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((starNum) => (
                <button
                  key={starNum}
                  type="button"
                  onClick={() => setReviewRating(starNum)}
                  className="hover:scale-110 active:scale-95 transition-all text-xl cursor-pointer outline-none"
                >
                  <Star 
                    className={`w-7 h-7 stroke-[1.5px] transition-all duration-300 ${
                      starNum <= reviewRating ? 'text-amber-400 fill-current drop-shadow-md scale-102' : 'text-gray-600'
                    }`} 
                  />
                </button>
              ))}
            </div>

            {/* Structured focus tag selector */}
            <div className="flex justify-center gap-1.5 mb-6">
              {[
                { tagKey: 'excellent', text: t.tagExcellent },
                { tagKey: 'good', text: t.tagGood },
                { tagKey: 'distracted', text: t.tagDistracted }
              ].map(({ tagKey, text }) => (
                <button
                  key={tagKey}
                  type="button"
                  onClick={() => setReviewTag(tagKey as any)}
                  className={`text-[9.5px] px-2.5 py-1.5 rounded-lg border font-mono transition-all uppercase cursor-pointer ${
                    reviewTag === tagKey 
                      ? 'bg-white/10 border-white text-white' 
                      : 'bg-transparent border-[#1c1c32] text-gray-400 hover:text-white'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            <button
              onClick={commitSessionLog}
              className="w-full py-2.5 text-white rounded-xl text-xs font-bold tracking-wide uppercase cursor-pointer hover:opacity-95 focus:outline-none transition-all"
              style={{ backgroundColor: CTheme.primary }}
            >
              {t.saveRatingBtn}
            </button>
          </div>
        </div>
      )}

      {/* SMART FLOATING HOW-TO GUIDE CARD - STATIC ON TOP-LEFT */}
      <div 
        id="smart-guide-card"
        className={`fixed top-6 left-6 z-40 max-w-[280px] w-full bg-[#10101c]/90 border border-[#1c1c32]/50 backdrop-blur-md rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out ${
          (!helpCardDismissed && !config.activeZen && !isFullScreen && timerShowHelp)
            ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' 
            : 'opacity-0 -translate-x-6 scale-95 pointer-events-none'
        }`}
      >
        {/* Minimal Close Button */}
        <button 
          onClick={() => setHelpCardDismissed(true)}
          title={lang === 'pt' ? 'Fechar' : lang === 'es' ? 'Cerrar' : 'Close'}
          className="absolute top-3 right-3 text-gray-500 hover:text-white cursor-pointer transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <h3 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2.5 font-mono flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" style={{ color: CTheme.primary }} />
          {lang === 'pt' ? 'Como Usar' : lang === 'es' ? 'Cómo Usar' : 'How to Use'}
        </h3>

        <div className="flex flex-col gap-2.5 text-[11px] leading-relaxed text-gray-400 select-none">
          <div className="flex gap-2 items-start">
            <span className="text-xs shrink-0 mt-0.5">⏱️</span>
            <span>
              {lang === 'pt' && <><strong className="text-white">Estrela (⭐)</strong> fixa o objetivo atual.</>}
              {lang === 'en' && <><strong className="text-white">Star (⭐)</strong> pins the current goal.</>}
              {lang === 'es' && <><strong className="text-white">Estrella (⭐)</strong> fija el objetivo actual.</>}
            </span>
          </div>
          <div className="flex gap-2 items-start border-t border-white/5 pt-2">
            <span className="text-xs shrink-0 mt-0.5">🎛️</span>
            <span>
              {lang === 'pt' && <><strong className="text-white">Arraste Knobs</strong> para cima ou para baixo para dosar o som.</>}
              {lang === 'en' && <><strong className="text-white">Drag Knobs</strong> up or down to adjust the sound.</>}
              {lang === 'es' && <><strong className="text-white">Arrastra Knobs</strong> arriba o abajo para regular el sonido.</>}
            </span>
          </div>
          <div className="flex gap-2 items-start border-t border-white/5 pt-2">
            <span className="text-xs shrink-0 mt-0.5">🫁</span>
            <span>
              {lang === 'pt' && <><strong className="text-white">Siga a auréola</strong> pulsante para regular sua respiração.</>}
              {lang === 'en' && <><strong className="text-white">Follow the pulsing halo</strong> to guide your breathing.</>}
              {lang === 'es' && <><strong className="text-white">Sigue la aureola</strong> pulsante para guiar tu respiración.</>}
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT CLEAN FOOTER (HIDDEN IN ZEN MODE) */}
      {!config.activeZen && (
        <footer id="app-footer" className="text-center mt-6 pt-4 border-t border-[#1c1c32]/40 relative z-10 w-full select-none animate-fadeIn">
          <div className="foot-links flex gap-4 justify-center">
            <button 
              type="button"
              onClick={() => setActiveTab('privacy')} 
              className="text-[10px] hover:opacity-80 font-mono uppercase bg-transparent border-none p-0 cursor-pointer"
              style={{ color: CTheme.primary }}
            >
              {t.privacyTab}
            </button>
            <span className="text-[#1c1c32] text-[10px] select-none">|</span>
            <button 
              type="button"
              onClick={() => setActiveTab('privacy')} 
              className="text-[10px] hover:opacity-80 font-mono uppercase bg-transparent border-none p-0 cursor-pointer"
              style={{ color: CTheme.primary }}
            >
              {t.termsTab}
            </button>

          </div>
          <small className="text-[9px] text-[#52526e] font-mono block mt-2.5">
            © 2026 RelogioFoco.com.br
          </small>
        </footer>
      )}
    </div>
  );
}
