import { createContext, useContext, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

const translations = {
  en: {
    appName: 'Liga MX Scorer',
    signOut: 'Sign Out',

    signIn: 'Sign In',
    createAccount: 'Create Account',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    show: 'Show',
    hide: 'Hide',
    register: 'Register',
    pleaseWait: 'Please wait...',
    noAccount: "Don't have an account? Register",
    haveAccount: 'Already have an account? Sign In',
    atLeast8: 'At least 8 characters',
    passwordsMatch: 'Passwords match',
    errorTitle: 'Error',
    usernameRequired: 'Username is required.',
    passwordMin: 'Password must be at least 8 characters.',
    passwordNoMatch: 'Passwords do not match.',
    usernameTaken: 'That username is already taken. Please choose a different one.',
    accountCreated: 'Account created!',
    canNowLogin: 'You can now log in.',

    myPicks: 'My Picks',
    grid: 'Grid',
    standings: 'Stats',
    groups: 'Groups',

    week: 'Week',
    locked: 'LOCKED',
    homeWin: 'Win',
    draw: 'Draw',
    awayWin: 'Loss',
    noMatches: 'No matches scheduled for this week.',
    couldNotSave: 'Could not save pick.',
    failedMatches: 'Failed to load matches.',
    failedGrid: 'Failed to load grid.',
    noPredictions: 'No predictions yet.',

    season: 'Season',
    thisWeek: 'This Week',
    player: 'Player',
    points: 'Points',
    noScores: 'No scores yet.',
    failedLeaderboard: 'Could not load leaderboard.',

    yourGroups: 'Your Groups',
    noGroupsYet: "You haven't joined any groups yet.",
    joinToSee: "Join a group to see others' picks.",
    code: 'Code',
    members: 'members',
    member: 'member',
    joinGroup: 'Join a Group',
    createGroup: '+ Create Group',
    joinAGroup: 'Join a Group',
    enter5Code: 'Enter 5-character join code',
    joining: 'Joining...',
    join: 'Join',
    cancel: 'Cancel',
    createGroupTitle: 'Create Group',
    groupName: 'Group name',
    joinCodeLabel: 'Join code (5 letters/numbers)',
    creating: 'Creating...',
    create: 'Create',
    codeMust5: 'Join code must be 5 characters.',
    codeLettersOnly: 'Join code must be letters and numbers only.',
    codeTaken: 'Code taken',
    codeTakenMsg: 'That join code is already in use. Choose a different one.',
    groupNameRequired: 'Group name is required.',
    notFound: 'Not found',
    noGroupCode: 'No group with that code exists.',
    alreadyJoined: 'Already joined',
    alreadyInGroup: 'You are already in that group.',
    joined: 'Joined!',
    joinedMsg: (name) => `You joined "${name}".`,
    createdMsg: (name, code) => `Group "${name}" created with code ${code}.`,
    failedGroups: 'Could not load groups.',
    noGroupSelected: 'No group selected.',
    goToGroups: 'Go to Groups →',

    // Settings / group gate
    settingsTitle:     'Settings',
    yourGroupLabel:    'Your Group',
    nameInGroup:       'Your Name in Group',
    save:              'Save',
    leaveGroup:        'Leave Group',
    leaveGroupConfirm: 'Leave this group? You will need a join code to rejoin.',
    leave:             'Leave',
    welcomeTitle:      'Welcome to Liga MX Scorer',
    welcomeSub:        'You need a group code to see picks and scores.',
    joinGroupBtn:      'Join a Group',
    orCreate:          '— or —',
    backBtn:           'Back',

    // Admin
    adminTitle: 'Admin Controls',
    lockWeek: '🔒  Lock Entire Week',
    unlockWeek: '🔓  Unlock Entire Week',
    individualMatches: 'Individual Matches',
    apiSync: 'API Sync',
    syncFixtures: '⬇  Sync Fixtures from API',
    scoreResults: '🏆  Score Results',
    locked2: 'Locked',
    open: 'Open',
    noMatchesAdmin: 'No matches found for this week.',
    confirmSyncFixtures: 'Fetch upcoming Liga MX matches from ESPN?',
    confirmScoreResults: 'Fetch finished match results and score all predictions?',
    syncFixturesTitle: 'Sync Fixtures',
    scoreResultsTitle: 'Score Results',
    run: 'Run',
    syncedMsg: 'Fixtures synced. Reload My Picks to see new matches.',
    scoredMsg: 'Results scored. Check the Standings tab.',
    lockDoneMsg: 'Week locked. No more predictions accepted.',
    unlockDoneMsg: 'Week unlocked. Predictions open.',
    done: 'Done',

    // Stats
    statsOverview:  'Prediction Accuracy',
    statsCorrect:   'Correct',
    statsWrong:     'Wrong',
    statsAccuracy:  'Accuracy',
    statsTotalPicks:'Total Picks',
    statsStreaks:   'Streaks',
    statsCurrent:   'Current Streak',
    statsBest:      'Best Streak',
    statsTeamTitle: 'Most Correct by Team',
    statsRecent:    'Recent Predictions',
    statsWin:       'CORRECT',
    statsLoss:      'WRONG',

    // Date formats
    matchDateFormat: 'ddd MMM D · h:mm A',
    colDateFormat: 'M/D',
  },

  es: {
    appName: 'Liga MX Scorer',
    signOut: 'Cerrar Sesión',

    signIn: 'Iniciar Sesión',
    createAccount: 'Crear Cuenta',
    username: 'Usuario',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    show: 'Ver',
    hide: 'Ocultar',
    register: 'Registrarse',
    pleaseWait: 'Por favor espera...',
    noAccount: '¿No tienes cuenta? Regístrate',
    haveAccount: '¿Ya tienes cuenta? Iniciar Sesión',
    atLeast8: 'Al menos 8 caracteres',
    passwordsMatch: 'Las contraseñas coinciden',
    errorTitle: 'Error',
    usernameRequired: 'El usuario es obligatorio.',
    passwordMin: 'La contraseña debe tener al menos 8 caracteres.',
    passwordNoMatch: 'Las contraseñas no coinciden.',
    usernameTaken: 'Ese usuario ya está en uso. Elige otro.',
    accountCreated: '¡Cuenta creada!',
    canNowLogin: 'Ya puedes iniciar sesión.',

    myPicks: 'Mis Picks',
    grid: 'Cuadro',
    standings: 'Stats',
    groups: 'Grupos',

    week: 'Semana',
    locked: 'CERRADO',
    homeWin: 'Gana',
    draw: 'Empate',
    awayWin: 'Pierde',
    noMatches: 'No hay partidos esta semana.',
    couldNotSave: 'No se pudo guardar el pick.',
    failedMatches: 'Error al cargar partidos.',
    failedGrid: 'Error al cargar el cuadro.',
    noPredictions: 'Sin predicciones aún.',

    season: 'Temporada',
    thisWeek: 'Esta Semana',
    player: 'Jugador',
    points: 'Puntos',
    noScores: 'Sin puntos aún.',
    failedLeaderboard: 'Error al cargar la tabla.',

    yourGroups: 'Tus Grupos',
    noGroupsYet: 'Aún no te has unido a ningún grupo.',
    joinToSee: 'Únete a un grupo para ver los picks.',
    code: 'Código',
    members: 'miembros',
    member: 'miembro',
    joinGroup: 'Unirse a un Grupo',
    createGroup: '+ Crear Grupo',
    joinAGroup: 'Unirse a un Grupo',
    enter5Code: 'Ingresa el código de 5 caracteres',
    joining: 'Uniéndose...',
    join: 'Unirse',
    cancel: 'Cancelar',
    createGroupTitle: 'Crear Grupo',
    groupName: 'Nombre del grupo',
    joinCodeLabel: 'Código (5 letras/números)',
    creating: 'Creando...',
    create: 'Crear',
    codeMust5: 'El código debe tener 5 caracteres.',
    codeLettersOnly: 'Solo letras y números.',
    codeTaken: 'Código en uso',
    codeTakenMsg: 'Ese código ya está en uso. Elige otro.',
    groupNameRequired: 'El nombre del grupo es obligatorio.',
    notFound: 'No encontrado',
    noGroupCode: 'No existe ningún grupo con ese código.',
    alreadyJoined: 'Ya eres miembro',
    alreadyInGroup: 'Ya estás en ese grupo.',
    joined: '¡Unido!',
    joinedMsg: (name) => `Te uniste a "${name}".`,
    createdMsg: (name, code) => `Grupo "${name}" creado con código ${code}.`,
    failedGroups: 'Error al cargar los grupos.',
    noGroupSelected: 'Ningún grupo seleccionado.',
    goToGroups: 'Ir a Grupos →',

    // Settings / group gate
    settingsTitle:     'Configuración',
    yourGroupLabel:    'Tu Grupo',
    nameInGroup:       'Tu Nombre en el Grupo',
    save:              'Guardar',
    leaveGroup:        'Salir del Grupo',
    leaveGroupConfirm: '¿Salir de este grupo? Necesitarás un código para volver a unirte.',
    leave:             'Salir',
    welcomeTitle:      'Bienvenido a Liga MX Scorer',
    welcomeSub:        'Necesitas un código de grupo para ver picks y resultados.',
    joinGroupBtn:      'Unirse a un Grupo',
    orCreate:          '— o —',
    backBtn:           'Regresar',

    // Admin
    adminTitle: 'Controles de Admin',
    lockWeek: '🔒  Cerrar Semana',
    unlockWeek: '🔓  Abrir Semana',
    individualMatches: 'Partidos Individuales',
    apiSync: 'Sincronización API',
    syncFixtures: '⬇  Sincronizar Partidos',
    scoreResults: '🏆  Calcular Resultados',
    locked2: 'Cerrado',
    open: 'Abierto',
    noMatchesAdmin: 'No se encontraron partidos esta semana.',
    confirmSyncFixtures: '¿Obtener partidos de Liga MX de ESPN?',
    confirmScoreResults: '¿Obtener resultados y calcular predicciones?',
    syncFixturesTitle: 'Sincronizar Partidos',
    scoreResultsTitle: 'Calcular Resultados',
    run: 'Ejecutar',
    syncedMsg: 'Partidos sincronizados. Recarga Mis Picks.',
    scoredMsg: 'Resultados calculados. Revisa la Tabla.',
    lockDoneMsg: 'Semana cerrada. No se aceptan más predicciones.',
    unlockDoneMsg: 'Semana abierta. Predicciones disponibles.',
    done: 'Listo',

    // Stats
    statsOverview:  'Precisión de Predicciones',
    statsCorrect:   'Correctas',
    statsWrong:     'Incorrectas',
    statsAccuracy:  'Precisión',
    statsTotalPicks:'Total de Picks',
    statsStreaks:   'Rachas',
    statsCurrent:   'Racha Actual',
    statsBest:      'Mejor Racha',
    statsTeamTitle: 'Mayor Acierto por Equipo',
    statsRecent:    'Predicciones Recientes',
    statsWin:       'CORRECTO',
    statsLoss:      'INCORRECTO',

    // Date formats (dayjs will use es locale for day/month names)
    matchDateFormat: 'ddd D [de] MMM · H:mm',
    colDateFormat: 'D/M',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  function setLanguage(newLang) {
    dayjs.locale(newLang);
    setLang(newLang);
  }

  const t = translations[lang];

  // Helper: format a date string using the current language's format + locale
  function fmtDate(dateStr, format) {
    return dayjs(dateStr).locale(lang).format(format || t.matchDateFormat);
  }

  // Helper: "Week 2026-W15" → "Semana 15, 2026"
  function fmtWeek(weekId) {
    const [year, wPart] = weekId.split('-W');
    return `${t.week} ${parseInt(wPart, 10)}, ${year}`;
  }

  return (
    <LanguageContext.Provider value={{ lang, t, setLanguage, fmtDate, fmtWeek }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
