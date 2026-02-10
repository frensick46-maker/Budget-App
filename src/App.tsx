import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import { isSupabaseConfigured, supabase } from './lib/supabaseClient'

const STORAGE_KEY = 'budget-app-state-v1'

type IncomeItem = {
  id: string
  name: string
  amountBaseUsd: number
  amountInput: string
}

type BonusEntry = {
  amountBaseUsd: number
  amountInput: string
}

type MonthlyExpenses = Record<string, IncomeItem[]>

type Locale = 'en' | 'es'

const translations = {
  en: {
    language: 'Language',
    currency: 'Currency',
    yearly: 'Yearly',
    monthly: 'Monthly',
    weekly: 'Weekly',
    overview: 'Overview',
    view: 'View',
    dashboard: 'Dashboard',
    income: 'Income',
    fixedExpenses: 'Fixed Expenses',
    remaining: 'Remaining',
    viewIncomes: 'View incomes',
    hideIncomes: 'Hide incomes',
    viewBonuses: 'View bonuses',
    hideBonuses: 'Hide bonuses',
    viewExpenses: 'View expenses',
    hideExpenses: 'Hide expenses',
    addBonus: 'Add bonus',
    incomeSubtextSuffix: 'paychecks, side gigs, bonuses',
    fixedVariableSubtext: 'Fixed + variable expenses',
    monthlyBonuses: 'Monthly Bonuses',
    noBonuses: 'No bonuses added yet.',
    monthlyBonus: 'Monthly bonus',
    incomeSources: 'Income Sources',
    addIncome: 'Add income',
    remove: 'Remove',
    fixedExpensesTitle: 'Fixed Expenses',
    addExpense: 'Add expense',
    variableExpenses: 'Variable Expenses',
    addVariable: 'Add variable',
    hideVariable: 'Hide variable',
    details: 'Details',
    addEntry: 'Add entry',
    totalIncome: 'Total income',
    snapshot: 'Snapshot',
    viewAll: 'View all',
    incomeSource: 'Income source',
    fixedExpense: 'Fixed expense',
    variableExpense: 'Variable expense',
    viewLabel: 'View',
    bonus: 'Bonus',
    defaultPaycheck: 'Paycheck',
    defaultSideGig: 'Side gig',
    defaultRent: 'Rent',
    defaultUtilities: 'Utilities',
    newIncome: 'New income',
    newExpense: 'New expense',
    newVariable: 'New variable',
    cloudSyncDisabled: 'Cloud sync disabled',
    cloudSyncDisabledHint:
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable sign-in.',
    checkingSession: 'Checking session...',
    signedIn: 'Signed in',
    signOut: 'Sign out',
    signInToSync: 'Sign in to sync',
    signIn: 'Sign in',
    hide: 'Hide',
    createAccount: 'Create account',
    email: 'Email',
    password: 'Password',
    setNewPassword: 'Set a new password',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    setPassword: 'Set password',
    passwordUpdated: 'Password updated.',
    passwordTooShort: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    statusLoading: 'Loading cloud data...',
    statusSaving: 'Saving changes...',
    statusError: 'Sync error',
    statusSaved: 'All changes saved',
    syncError: 'Sync error',
    checkEmailConfirm: 'Check your email to confirm the account.',
  },
  es: {
    language: 'Idioma',
    currency: 'Moneda',
    yearly: 'Anual',
    monthly: 'Mensual',
    weekly: 'Semanal',
    overview: 'Resumen',
    view: 'Vista',
    dashboard: 'Panel',
    income: 'Ingresos',
    fixedExpenses: 'Gastos fijos',
    remaining: 'Restante',
    viewIncomes: 'Ver ingresos',
    hideIncomes: 'Ocultar ingresos',
    viewBonuses: 'Ver bonos',
    hideBonuses: 'Ocultar bonos',
    viewExpenses: 'Ver gastos',
    hideExpenses: 'Ocultar gastos',
    addBonus: 'Agregar bono',
    incomeSubtextSuffix: 'sueldos, trabajos extra, bonos',
    fixedVariableSubtext: 'Gastos fijos + variables',
    monthlyBonuses: 'Bonos mensuales',
    noBonuses: 'Aun no hay bonos.',
    monthlyBonus: 'Bono mensual',
    incomeSources: 'Fuentes de ingreso',
    addIncome: 'Agregar ingreso',
    remove: 'Eliminar',
    fixedExpensesTitle: 'Gastos fijos',
    addExpense: 'Agregar gasto',
    variableExpenses: 'Gastos variables',
    addVariable: 'Agregar variable',
    hideVariable: 'Ocultar variable',
    details: 'Detalles',
    addEntry: 'Agregar registro',
    totalIncome: 'Ingreso total',
    snapshot: 'Resumen',
    viewAll: 'Ver todo',
    incomeSource: 'Fuente de ingreso',
    fixedExpense: 'Gasto fijo',
    variableExpense: 'Gasto variable',
    viewLabel: 'Ver',
    bonus: 'Bono',
    defaultPaycheck: 'Sueldo',
    defaultSideGig: 'Trabajo extra',
    defaultRent: 'Renta',
    defaultUtilities: 'Servicios',
    newIncome: 'Nuevo ingreso',
    newExpense: 'Nuevo gasto',
    newVariable: 'Nuevo variable',
    cloudSyncDisabled: 'Sincronizacion desactivada',
    cloudSyncDisabledHint:
      'Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a .env para activar el inicio de sesion.',
    checkingSession: 'Revisando sesion...',
    signedIn: 'Sesion iniciada',
    signOut: 'Cerrar sesion',
    signInToSync: 'Inicia sesion para sincronizar',
    signIn: 'Iniciar sesion',
    hide: 'Ocultar',
    createAccount: 'Crear cuenta',
    email: 'Correo',
    password: 'Contrasena',
    setNewPassword: 'Configura una nueva contrasena',
    newPassword: 'Nueva contrasena',
    confirmNewPassword: 'Confirmar contrasena',
    setPassword: 'Guardar contrasena',
    passwordUpdated: 'Contrasena actualizada.',
    passwordTooShort: 'La contrasena debe tener al menos 6 caracteres.',
    passwordMismatch: 'Las contrasenas no coinciden.',
    statusLoading: 'Cargando datos en la nube...',
    statusSaving: 'Guardando cambios...',
    statusError: 'Error de sincronizacion',
    statusSaved: 'Todos los cambios guardados',
    syncError: 'Error de sincronizacion',
    checkEmailConfirm: 'Revisa tu correo para confirmar la cuenta.',
  },
} as const

type TranslationKey = keyof typeof translations.en

const monthLabels: Record<Locale, Record<string, string>> = {
  en: {
    Jan: 'Jan',
    Feb: 'Feb',
    Mar: 'Mar',
    Apr: 'Apr',
    May: 'May',
    Jun: 'Jun',
    Jul: 'Jul',
    Aug: 'Aug',
    Sep: 'Sep',
    Oct: 'Oct',
    Nov: 'Nov',
    Dec: 'Dec',
  },
  es: {
    Jan: 'Ene',
    Feb: 'Feb',
    Mar: 'Mar',
    Apr: 'Abr',
    May: 'May',
    Jun: 'Jun',
    Jul: 'Jul',
    Aug: 'Ago',
    Sep: 'Sep',
    Oct: 'Oct',
    Nov: 'Nov',
    Dec: 'Dic',
  },
}

type StoredState = {
  incomes?: IncomeItem[]
  fixedExpenses?: IncomeItem[]
  monthlyBonuses?: Record<string, BonusEntry>
  variableExpensesByMonth?: MonthlyExpenses
  currencyCode?: string
  period?: 'monthly' | 'weekly' | 'yearly'
  activeTab?: string
  activeMonth?: string
  showIncomePanel?: boolean
  showFixedExpensesPanel?: boolean
  locale?: Locale
}

const loadStoredState = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as StoredState
  } catch {
    return null
  }
}

const normalizeItem = (item: Partial<IncomeItem>): IncomeItem => ({
  id: item.id ?? `item-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  name: item.name ?? 'New item',
  amountBaseUsd: item.amountBaseUsd ?? 0,
  amountInput:
    item.amountInput ??
    `${item.amountBaseUsd ?? 0}`,
})

const buildDefaultIncomes = (
  translate: (key: string) => string
): IncomeItem[] => [
  {
    id: 'income-1',
    name: translate('defaultPaycheck'),
    amountBaseUsd: 0,
    amountInput: '0',
  },
  {
    id: 'income-2',
    name: translate('defaultSideGig'),
    amountBaseUsd: 0,
    amountInput: '0',
  },
]

const buildDefaultFixedExpenses = (
  translate: (key: string) => string
): IncomeItem[] => [
  {
    id: 'expense-1',
    name: translate('defaultRent'),
    amountBaseUsd: 0,
    amountInput: '0',
  },
  {
    id: 'expense-2',
    name: translate('defaultUtilities'),
    amountBaseUsd: 0,
    amountInput: '0',
  },
]

const normalizeBonus = (entry?: Partial<BonusEntry>): BonusEntry => ({
  amountBaseUsd: entry?.amountBaseUsd ?? 0,
  amountInput: entry?.amountInput ?? `${entry?.amountBaseUsd ?? 0}`,
})

const normalizeBonuses = (value?: Record<string, BonusEntry>) => {
  const normalized: Record<string, BonusEntry> = {}
  Object.entries(value ?? {}).forEach(([month, entry]) => {
    normalized[month] = normalizeBonus(entry)
  })
  return normalized
}

const normalizeMonthlyExpenses = (value?: MonthlyExpenses) => {
  const normalized: MonthlyExpenses = {}
  Object.entries(value ?? {}).forEach(([month, items]) => {
    normalized[month] = items.map((item) => normalizeItem(item))
  })
  return normalized
}

function App() {
  const storedState = loadStoredState()
  const [locale, setLocale] = useState<Locale>(storedState?.locale ?? 'en')
  const t = useCallback(
    (key: string) =>
      translations[locale][key as TranslationKey] ??
      translations.en[key as TranslationKey] ??
      key,
    [locale]
  )
  const monthLabel = useCallback(
    (monthId: string) => monthLabels[locale][monthId] ?? monthId,
    [locale]
  )
  const defaultIncomes = useMemo(() => buildDefaultIncomes(t), [t])
  const defaultFixedExpenses = useMemo(
    () => buildDefaultFixedExpenses(t),
    [t]
  )
  const [incomes, setIncomes] = useState<IncomeItem[]>(
    () =>
      storedState?.incomes?.map((item) => normalizeItem(item)) ??
      defaultIncomes
  )
  const [fixedExpenses, setFixedExpenses] = useState<IncomeItem[]>(
    () =>
      storedState?.fixedExpenses?.map((item) => normalizeItem(item)) ??
      defaultFixedExpenses
  )
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>(
    storedState?.period ?? 'monthly'
  )
  const [activeTab, setActiveTab] = useState(
    storedState?.activeTab ?? 'Dashboard'
  )
  const [activeMonth, setActiveMonth] = useState(
    storedState?.activeMonth ?? 'Jan'
  )
  const [showIncomePanel, setShowIncomePanel] = useState(
    storedState?.showIncomePanel ?? false
  )
  const [showFixedExpensesPanel, setShowFixedExpensesPanel] = useState(
    storedState?.showFixedExpensesPanel ?? false
  )
  const [monthlyBonuses, setMonthlyBonuses] = useState<
    Record<string, BonusEntry>
  >(() => normalizeBonuses(storedState?.monthlyBonuses))
  const [variableExpensesByMonth, setVariableExpensesByMonth] =
    useState<MonthlyExpenses>(() =>
      normalizeMonthlyExpenses(storedState?.variableExpensesByMonth)
    )
  const [showBonusInput, setShowBonusInput] = useState<
    Record<string, boolean>
  >({})
  const [showBonusList, setShowBonusList] = useState(false)
  const [showVariableExpensesPanel, setShowVariableExpensesPanel] = useState<
    Record<string, boolean>
  >({})
  const [session, setSession] = useState<Session | null>(null)
  const [isRecovery, setIsRecovery] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'loading' | 'saving' | 'error'
  >('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncReady, setSyncReady] = useState(false)
  const pendingSyncRef = useRef<number | null>(null)
  const skipNextSyncRef = useRef(false)
  const previousSessionRef = useRef<Session | null>(null)

  const currencies = useMemo(
    () => [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
      { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', rate: 7.8 },
    ],
    []
  )
  const [currencyCode, setCurrencyCode] = useState(
    storedState?.currencyCode ?? currencies[0].code
  )
  const selectedCurrency =
    currencies.find((currency) => currency.code === currencyCode) ??
    currencies[0]

  const periodLabel =
    period === 'monthly'
      ? t('monthly')
      : period === 'weekly'
        ? t('weekly')
        : t('yearly')
  const incomeSubtext = `${periodLabel} ${t('incomeSubtextSuffix')}`
  const periodFactor =
    period === 'monthly' ? 1 : period === 'weekly' ? 1 / 4 : 12

  const formatNumber = (value: number) => {
    const hasDecimal = Math.abs(value % 1) > 0
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: hasDecimal ? 2 : 0,
    }).format(value)
  }
  const formatCurrency = (value: number) =>
    `${selectedCurrency.symbol}${formatNumber(value)}`
  const formatSignedCurrency = (value: number) =>
    `${value < 0 ? '-' : '+'}${formatCurrency(Math.abs(value))}`
  const convert = (value: number) =>
    value * selectedCurrency.rate * periodFactor
  const incomeTotalBaseUsd = incomes.reduce(
    (total, incomeItem) => total + incomeItem.amountBaseUsd,
    0
  )
  const fixedExpensesTotalBaseUsd = fixedExpenses.reduce(
    (total, expenseItem) => total + expenseItem.amountBaseUsd,
    0
  )
  const activeBonus = normalizeBonus(monthlyBonuses[activeMonth])
  const bonusSumBaseUsd = Object.values(monthlyBonuses).reduce(
    (total, entry) => total + normalizeBonus(entry).amountBaseUsd,
    0
  )
  const activeVariableExpenses = variableExpensesByMonth[activeMonth] ?? []
  const variableExpensesTotalBaseUsd = activeVariableExpenses.reduce(
    (total, item) => total + item.amountBaseUsd,
    0
  )
  const variableExpensesSumBaseUsd = Object.values(
    variableExpensesByMonth
  ).reduce(
    (total, expenses) =>
      total +
      expenses.reduce((sum, item) => sum + item.amountBaseUsd, 0),
    0
  )
  const monthIncomeBaseUsd = incomeTotalBaseUsd + activeBonus.amountBaseUsd
  const monthExpensesBaseUsd =
    fixedExpensesTotalBaseUsd + variableExpensesTotalBaseUsd
  const monthRemainingBaseUsd = monthIncomeBaseUsd - monthExpensesBaseUsd
  const toBaseMonthly = (displayValue: number) =>
    displayValue / (selectedCurrency.rate * periodFactor)
  const toDisplayAmount = (baseMonthlyValue: number) =>
    baseMonthlyValue * selectedCurrency.rate * periodFactor
  const formatDisplayAmount = (baseMonthlyValue: number) =>
    formatNumber(toDisplayAmount(baseMonthlyValue))
  const formatBonusAmount = (baseMonthlyValue: number) =>
    `${selectedCurrency.symbol}${formatNumber(
      baseMonthlyValue * selectedCurrency.rate
    )}`
  const buildStoredState = useCallback(
    (): StoredState => ({
      incomes,
      fixedExpenses,
      monthlyBonuses,
      variableExpensesByMonth,
      currencyCode,
      period,
      activeTab,
      activeMonth,
      showIncomePanel,
      showFixedExpensesPanel,
      locale,
    }),
    [
      incomes,
      fixedExpenses,
      monthlyBonuses,
      variableExpensesByMonth,
      currencyCode,
      period,
      activeTab,
      activeMonth,
      showIncomePanel,
      showFixedExpensesPanel,
      locale,
    ]
  )

  const resetToDefaults = useCallback(() => {
    skipNextSyncRef.current = true
    setIncomes(defaultIncomes.map((item) => ({ ...item })))
    setFixedExpenses(defaultFixedExpenses.map((item) => ({ ...item })))
    setMonthlyBonuses({})
    setVariableExpensesByMonth({})
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [defaultFixedExpenses, defaultIncomes])

  const applyStoredState = useCallback((state?: StoredState | null) => {
    if (!state) {
      return
    }
    skipNextSyncRef.current = true
    if (state.incomes) {
      setIncomes(state.incomes.map((item) => normalizeItem(item)))
    }
    if (state.fixedExpenses) {
      setFixedExpenses(state.fixedExpenses.map((item) => normalizeItem(item)))
    }
    if (state.monthlyBonuses) {
      setMonthlyBonuses(normalizeBonuses(state.monthlyBonuses))
    }
    if (state.variableExpensesByMonth) {
      setVariableExpensesByMonth(
        normalizeMonthlyExpenses(state.variableExpensesByMonth)
      )
    }
    if (state.currencyCode) {
      setCurrencyCode(state.currencyCode)
    }
    if (state.period) {
      setPeriod(state.period)
    }
    if (state.activeTab) {
      setActiveTab(state.activeTab)
    }
    if (state.activeMonth) {
      setActiveMonth(state.activeMonth)
    }
    if (typeof state.showIncomePanel === 'boolean') {
      setShowIncomePanel(state.showIncomePanel)
    }
    if (typeof state.showFixedExpensesPanel === 'boolean') {
      setShowFixedExpensesPanel(state.showFixedExpensesPanel)
    }
    if (state.locale) {
      setLocale(state.locale)
    }
  }, [isSupabaseConfigured])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false)
      return
    }

    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      setSession(data.session)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
      }
      if (event === 'SIGNED_OUT') {
        setIsRecovery(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleRecoveryComplete = useCallback(() => {
    setIsRecovery(false)
  }, [])

  useEffect(() => {
    const wasSignedIn = Boolean(previousSessionRef.current)
    previousSessionRef.current = session
    if (wasSignedIn && !session) {
      resetToDefaults()
    }
  }, [session, resetToDefaults])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }
    if (!session) {
      setSyncReady(false)
      setSyncStatus('idle')
      setSyncError(null)
      return
    }

    let isMounted = true
    setSyncStatus('loading')
    setSyncError(null)

    const loadRemoteState = async () => {
      const { data, error } = await supabase
        .from('budget_state')
        .select('state')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (error) {
        setSyncStatus('error')
        setSyncError(error.message)
        setSyncReady(true)
        return
      }

      if (data?.state) {
        applyStoredState(data.state as StoredState)
      }

      setSyncStatus('idle')
      setSyncReady(true)
    }

    loadRemoteState()

    return () => {
      isMounted = false
    }
  }, [session?.user.id, isSupabaseConfigured, applyStoredState])

  useEffect(() => {
    setIncomes((prev) =>
      prev.map((incomeItem) => ({
        ...incomeItem,
        amountInput: formatDisplayAmount(incomeItem.amountBaseUsd),
      }))
    )
    setFixedExpenses((prev) =>
      prev.map((expenseItem) => ({
        ...expenseItem,
        amountInput: formatDisplayAmount(expenseItem.amountBaseUsd),
      }))
    )
    setMonthlyBonuses((prev) => {
      const current = prev[activeMonth]
      if (!current) {
        return prev
      }
      return {
        ...prev,
        [activeMonth]: {
          ...current,
          amountInput: formatDisplayAmount(current.amountBaseUsd),
        },
      }
    })
    setVariableExpensesByMonth((prev) => {
      const updated: MonthlyExpenses = {}
      Object.entries(prev).forEach(([month, items]) => {
        updated[month] = items.map((item) => ({
          ...item,
          amountInput: formatDisplayAmount(item.amountBaseUsd),
        }))
      })
      return updated
    })
    // Only update when currency/period/month changes to avoid disrupting typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyCode, period, activeMonth])

  useEffect(() => {
    if (activeTab !== 'Dashboard') {
      setPeriod('monthly')
    }
  }, [activeTab])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload = buildStoredState()

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [buildStoredState])

  useEffect(() => {
    if (!isSupabaseConfigured || !session || !syncReady) {
      return
    }
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }

    if (pendingSyncRef.current) {
      window.clearTimeout(pendingSyncRef.current)
    }

    pendingSyncRef.current = window.setTimeout(async () => {
      setSyncStatus('saving')
      setSyncError(null)
      const payload = buildStoredState()
      const { error } = await supabase.from('budget_state').upsert({
        user_id: session.user.id,
        state: payload,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        setSyncStatus('error')
        setSyncError(error.message)
        return
      }

      setSyncStatus('idle')
    }, 800)

    return () => {
      if (pendingSyncRef.current) {
        window.clearTimeout(pendingSyncRef.current)
      }
    }
  }, [session, syncReady, buildStoredState, isSupabaseConfigured])

  const sanitizeAmountInput = (value: string) => {
    const normalized = value.replace(/[^0-9.]/g, '')
    const parts = normalized.split('.')
    return parts.length <= 1
      ? normalized
      : `${parts[0]}.${parts.slice(1).join('')}`
  }

  const handleIncomeNameChange = (id: string, value: string) => {
    setIncomes((prev) =>
      prev.map((incomeItem) =>
        incomeItem.id === id ? { ...incomeItem, name: value } : incomeItem
      )
    )
  }

  const handleIncomeAmountChange = (id: string, value: string) => {
    const sanitized = sanitizeAmountInput(value)
    const nextValue = sanitized === '' ? 0 : Number(sanitized)
    setIncomes((prev) =>
      prev.map((incomeItem) =>
        incomeItem.id === id
          ? {
              ...incomeItem,
              amountBaseUsd: toBaseMonthly(nextValue),
              amountInput: sanitized,
            }
          : incomeItem
      )
    )
  }

  const handleIncomeAmountBlur = (id: string) => {
    setIncomes((prev) =>
      prev.map((incomeItem) =>
        incomeItem.id === id
          ? {
              ...incomeItem,
              amountInput: formatDisplayAmount(incomeItem.amountBaseUsd),
            }
          : incomeItem
      )
    )
  }

  const handleFixedExpenseNameChange = (id: string, value: string) => {
    setFixedExpenses((prev) =>
      prev.map((expenseItem) =>
        expenseItem.id === id ? { ...expenseItem, name: value } : expenseItem
      )
    )
  }

  const handleFixedExpenseAmountChange = (id: string, value: string) => {
    const sanitized = sanitizeAmountInput(value)
    const nextValue = sanitized === '' ? 0 : Number(sanitized)
    setFixedExpenses((prev) =>
      prev.map((expenseItem) =>
        expenseItem.id === id
          ? {
              ...expenseItem,
              amountBaseUsd: toBaseMonthly(nextValue),
              amountInput: sanitized,
            }
          : expenseItem
      )
    )
  }

  const handleFixedExpenseAmountBlur = (id: string) => {
    setFixedExpenses((prev) =>
      prev.map((expenseItem) =>
        expenseItem.id === id
          ? {
              ...expenseItem,
              amountInput: formatDisplayAmount(expenseItem.amountBaseUsd),
            }
          : expenseItem
      )
    )
  }

  const handleEnterBlur: React.KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  const handleBonusEnter =
    (month: string): React.KeyboardEventHandler<HTMLInputElement> =>
    (event) => {
      if (event.key === 'Enter') {
        event.currentTarget.blur()
        setShowBonusInput((prev) => ({
          ...prev,
          [month]: false,
        }))
      }
    }

  const handleAddIncome = () => {
    setIncomes((prev) => [
      ...prev,
      {
        id: `income-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        name: t('newIncome'),
        amountBaseUsd: 0,
        amountInput: '0',
      },
    ])
  }

  const handleRemoveIncome = (id: string) => {
    setIncomes((prev) => prev.filter((incomeItem) => incomeItem.id !== id))
  }

  const handleBonusAmountChange = (month: string, value: string) => {
    const sanitized = sanitizeAmountInput(value)
    const nextValue = sanitized === '' ? 0 : Number(sanitized)
    setMonthlyBonuses((prev) => ({
      ...prev,
      [month]: {
        amountBaseUsd: toBaseMonthly(nextValue),
        amountInput: sanitized,
      },
    }))
  }

  const handleBonusAmountBlur = (month: string) => {
    setMonthlyBonuses((prev) => {
      const current = prev[month]
      if (!current) {
        return prev
      }
      return {
        ...prev,
        [month]: {
          ...current,
          amountInput: formatDisplayAmount(current.amountBaseUsd),
        },
      }
    })
    setShowBonusInput((prev) => ({
      ...prev,
      [month]: false,
    }))
  }

  const handleAddFixedExpense = () => {
    setFixedExpenses((prev) => [
      ...prev,
      {
        id: `expense-${Date.now()}-${Math.round(Math.random() * 1000)}`,
        name: t('newExpense'),
        amountBaseUsd: 0,
        amountInput: '0',
      },
    ])
  }

  const handleRemoveFixedExpense = (id: string) => {
    setFixedExpenses((prev) => prev.filter((expenseItem) => expenseItem.id !== id))
  }

  const handleVariableExpenseNameChange = (
    month: string,
    id: string,
    value: string
  ) => {
    setVariableExpensesByMonth((prev) => ({
      ...prev,
      [month]: (prev[month] ?? []).map((item) =>
        item.id === id ? { ...item, name: value } : item
      ),
    }))
  }

  const handleVariableExpenseAmountChange = (
    month: string,
    id: string,
    value: string
  ) => {
    const sanitized = sanitizeAmountInput(value)
    const nextValue = sanitized === '' ? 0 : Number(sanitized)
    setVariableExpensesByMonth((prev) => ({
      ...prev,
      [month]: (prev[month] ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              amountBaseUsd: toBaseMonthly(nextValue),
              amountInput: sanitized,
            }
          : item
      ),
    }))
  }

  const handleVariableExpenseAmountBlur = (month: string, id: string) => {
    setVariableExpensesByMonth((prev) => ({
      ...prev,
      [month]: (prev[month] ?? []).map((item) =>
        item.id === id
          ? {
              ...item,
              amountInput: formatDisplayAmount(item.amountBaseUsd),
            }
          : item
      ),
    }))
  }

  const handleAddVariableExpense = (month: string) => {
    setVariableExpensesByMonth((prev) => ({
      ...prev,
      [month]: [
        ...(prev[month] ?? []),
        {
          id: `variable-${Date.now()}-${Math.round(Math.random() * 1000)}`,
          name: t('newVariable'),
          amountBaseUsd: 0,
          amountInput: '0',
        },
      ],
    }))
  }

  const handleRemoveVariableExpense = (month: string, id: string) => {
    setVariableExpensesByMonth((prev) => ({
      ...prev,
      [month]: (prev[month] ?? []).filter((item) => item.id !== id),
    }))
  }

  const monthTabs = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const isDashboard = activeTab === 'Dashboard'
  const isMonthView = !isDashboard
  const bonusInputOpen = isMonthView && showBonusInput[activeTab]
  const activeTabLabel = isDashboard ? t('dashboard') : monthLabel(activeTab)
  const formatBonusTitle = (label: string) =>
    locale === 'es' ? `${t('bonus')} de ${label}` : `${label} ${t('bonus')}`
  const dashboardIncomeDisplay =
    period === 'yearly'
      ? formatCurrency(
          incomeTotalBaseUsd * selectedCurrency.rate * 12 +
            bonusSumBaseUsd * selectedCurrency.rate
        )
      : formatCurrency(toDisplayAmount(incomeTotalBaseUsd))
  const monthIncomeTotalDisplay = formatCurrency(
    toDisplayAmount(monthIncomeBaseUsd)
  )
  const dashboardExpensesDisplay =
    period === 'yearly'
      ? formatCurrency(
          (fixedExpensesTotalBaseUsd * 12 + variableExpensesSumBaseUsd) *
            selectedCurrency.rate
        )
      : formatCurrency(
          toDisplayAmount(
            fixedExpensesTotalBaseUsd + variableExpensesTotalBaseUsd
          )
        )
  const monthExpensesTotalDisplay = formatCurrency(
    toDisplayAmount(monthExpensesBaseUsd)
  )
  const dashboardRemainingDisplay =
    period === 'yearly'
      ? formatCurrency(
          (incomeTotalBaseUsd * 12 +
            bonusSumBaseUsd -
            fixedExpensesTotalBaseUsd * 12 -
            variableExpensesSumBaseUsd) *
            selectedCurrency.rate
        )
      : formatCurrency(
          toDisplayAmount(
            incomeTotalBaseUsd -
              fixedExpensesTotalBaseUsd -
              variableExpensesTotalBaseUsd
          )
        )
  const monthRemainingDisplay = formatCurrency(
    toDisplayAmount(monthRemainingBaseUsd)
  )
  const sortedIncomes = [...incomes].sort(
    (a, b) => b.amountBaseUsd - a.amountBaseUsd
  )
  const sortedFixedExpenses = [...fixedExpenses].sort(
    (a, b) => b.amountBaseUsd - a.amountBaseUsd
  )
  const sortedVariableExpenses = [...activeVariableExpenses].sort(
    (a, b) => b.amountBaseUsd - a.amountBaseUsd
  )
  const monthIncomeEntries = [
    ...(activeBonus.amountBaseUsd > 0
      ? [
          {
            id: `bonus-${activeTab}`,
            name: formatBonusTitle(activeTabLabel),
            subtitle: t('monthlyBonus'),
            amount: `${activeBonus.amountBaseUsd < 0 ? '-' : '+'}${formatBonusAmount(
              Math.abs(activeBonus.amountBaseUsd)
            )}`,
            isPositive: true,
            sortValue: activeBonus.amountBaseUsd,
          },
        ]
      : []),
    ...sortedIncomes.map((incomeItem) => ({
      id: incomeItem.id,
      name: incomeItem.name,
      subtitle: t('incomeSource'),
      amount: formatSignedCurrency(convert(incomeItem.amountBaseUsd)),
      isPositive: true,
      sortValue: incomeItem.amountBaseUsd,
    })),
  ].sort((a, b) => b.sortValue - a.sortValue)
  const monthExpenseEntries = [
    ...sortedFixedExpenses.map((expenseItem) => ({
      id: expenseItem.id,
      name: expenseItem.name,
      subtitle: t('fixedExpense'),
      amount: formatSignedCurrency(convert(-expenseItem.amountBaseUsd)),
      isPositive: false,
      sortValue: expenseItem.amountBaseUsd,
    })),
    ...sortedVariableExpenses.map((expenseItem) => ({
      id: expenseItem.id,
      name: expenseItem.name,
      subtitle: t('variableExpense'),
      amount: formatSignedCurrency(convert(-expenseItem.amountBaseUsd)),
      isPositive: false,
      sortValue: expenseItem.amountBaseUsd,
    })),
  ].sort((a, b) => b.sortValue - a.sortValue)
  const monthEntries = [
    ...monthIncomeEntries.map(({ sortValue, ...rest }) => rest),
    ...monthExpenseEntries.map(({ sortValue, ...rest }) => rest),
  ]
  const bonusList = monthTabs
    .map((month) => ({
      month,
      entry: normalizeBonus(monthlyBonuses[month]),
    }))
    .filter((item) => item.entry.amountBaseUsd > 0)

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Budget App</p>
          <h1>
            {isDashboard
              ? `${periodLabel} ${t('overview')}`
              : `${activeTabLabel} ${t('view')}`}
          </h1>
          <div className="controls-row">
            <div className="currency-control">
              <label className="currency-label" htmlFor="currency">
                {t('currency')}
              </label>
              <select
                id="currency"
                className="currency-select"
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value)}
              >
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} · {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="currency-control">
              <label className="currency-label" htmlFor="language">
                {t('language')}
              </label>
              <select
                id="language"
                className="currency-select"
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
              >
                <option value="en">English</option>
                <option value="es">Espanol</option>
              </select>
            </div>
            <div className="period-toggle">
              <button
                className={`toggle-button ${
                  period === 'yearly' ? 'active' : ''
                }`}
                type="button"
                onClick={() => setPeriod('yearly')}
                disabled={!isDashboard}
              >
                {t('yearly')}
              </button>
              <button
                className={`toggle-button ${
                  period === 'monthly' ? 'active' : ''
                }`}
                type="button"
                onClick={() => setPeriod('monthly')}
                disabled={!isDashboard}
              >
                {t('monthly')}
              </button>
              <button
                className={`toggle-button ${
                  period === 'weekly' ? 'active' : ''
                }`}
                type="button"
                onClick={() => setPeriod('weekly')}
                disabled={!isDashboard}
              >
                {t('weekly')}
              </button>
            </div>
          </div>
        </div>
        <Auth
          session={session}
          loading={authLoading}
          isConfigured={isSupabaseConfigured}
          syncStatus={syncStatus}
          syncError={syncError}
          isRecovery={isRecovery}
          onRecoveryComplete={handleRecoveryComplete}
          t={t}
        />
      </header>

      <nav className="tabs">
        <button
          className={`tab-button ${activeTab === 'Dashboard' ? 'active' : ''}`}
          type="button"
          onClick={() => setActiveTab('Dashboard')}
        >
          {t('dashboard')}
        </button>
        <div className="month-select">
          <label className="month-label" htmlFor="month">
            {t('viewLabel')}
          </label>
          <select
            id="month"
            className="month-dropdown"
            value={activeMonth}
            onClick={() => {
              if (activeTab === 'Dashboard') {
                setActiveTab(activeMonth)
              }
            }}
            onChange={(event) => {
              const nextMonth = event.target.value
              if (nextMonth === activeMonth) {
                setActiveTab(nextMonth)
                return
              }
              setActiveMonth(nextMonth)
              setActiveTab(nextMonth)
            }}
          >
            {monthTabs.map((tab) => (
              <option key={tab} value={tab}>
                {monthLabel(tab)} {t('view')}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {isDashboard ? (
        <>
          <section className="summary-grid">
            <div className="summary-card">
              <div className="summary-header">
                <p className="summary-label">{t('income')}</p>
                <div className="summary-actions">
                  {isDashboard ? (
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() => setShowIncomePanel((prev) => !prev)}
                    >
                      {showIncomePanel ? t('hideIncomes') : t('viewIncomes')}
                    </button>
                  ) : (
                    <button
                      className="ghost-button small"
                      type="button"
                      onClick={() =>
                        setShowBonusInput((prev) => ({
                          ...prev,
                          [activeTab]: !prev[activeTab],
                        }))
                      }
                    >
                      {t('addBonus')}
                    </button>
                  )}
                  <button
                    className="ghost-button small"
                    type="button"
                    onClick={() => setShowBonusList((prev) => !prev)}
                  >
                    {showBonusList ? t('hideBonuses') : t('viewBonuses')}
                  </button>
                </div>
              </div>
              <p className="summary-value">
                {dashboardIncomeDisplay}
              </p>
              {bonusInputOpen && (
                <div className="bonus-input-row" dir="ltr">
                  <span className="currency">{selectedCurrency.symbol}</span>
                  <input
                    className="income-input"
                    inputMode="decimal"
                    value={activeBonus.amountInput}
                    onChange={(event) =>
                      handleBonusAmountChange(activeTab, event.target.value)
                    }
                    onKeyDown={handleEnterBlur}
                    onBlur={() => handleBonusAmountBlur(activeTab)}
                    aria-label={`${activeTabLabel} ${t('bonus')}`}
                  />
                </div>
              )}
              <p className="summary-subtext">{incomeSubtext}</p>
            </div>
            <div className="summary-card">
              <div className="summary-header">
                <p className="summary-label">{t('fixedExpenses')}</p>
                <button
                  className="ghost-button small"
                  type="button"
                  onClick={() => setShowFixedExpensesPanel((prev) => !prev)}
                >
                  {showFixedExpensesPanel
                    ? t('hideExpenses')
                    : t('viewExpenses')}
                </button>
              </div>
              <p className="summary-value">
                {dashboardExpensesDisplay}
              </p>
              <p className="summary-subtext">{t('fixedVariableSubtext')}</p>
            </div>
            <div className="summary-card highlight">
              <p className="summary-label">{t('remaining')}</p>
              <p className="summary-value">
                {dashboardRemainingDisplay}
              </p>
            </div>
          </section>

          <section className="content-grid">
            {showBonusList && (
              <div className="panel">
                <div className="panel-header">
                  <h2>{t('monthlyBonuses')}</h2>
                </div>
                {bonusList.length === 0 ? (
                  <p className="summary-subtext">{t('noBonuses')}</p>
                ) : (
                  <ul className="list">
                    {bonusList.map((item) => (
                      <li className="list-row" key={item.month}>
                        <div>
                          <p className="list-title">{monthLabel(item.month)}</p>
                          <p className="list-subtitle">{t('monthlyBonus')}</p>
                        </div>
                        <span className="amount positive">
                          {`${item.entry.amountBaseUsd < 0 ? '-' : '+'}${formatBonusAmount(
                            Math.abs(item.entry.amountBaseUsd)
                          )}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {showIncomePanel && (
              <div className="panel income-panel" dir="ltr">
                <div className="panel-header">
                  <h2>{t('incomeSources')}</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleAddIncome}
                  >
                    {t('addIncome')}
                  </button>
                </div>
                <div className="income-list">
                  {sortedIncomes.map((incomeItem) => (
                    <div className="income-row" key={incomeItem.id}>
                      <input
                        className="income-name"
                        type="text"
                        dir="ltr"
                        value={incomeItem.name}
                        onChange={(event) =>
                          handleIncomeNameChange(
                            incomeItem.id,
                            event.target.value
                          )
                        }
                        onKeyDown={handleEnterBlur}
                        aria-label="Income name"
                      />
                      <div className="income-amount">
                        <span className="currency">
                          {selectedCurrency.symbol}
                        </span>
                        <input
                          className="income-input"
                          inputMode="decimal"
                          value={incomeItem.amountInput}
                          onChange={(event) =>
                            handleIncomeAmountChange(
                              incomeItem.id,
                              event.target.value
                            )
                          }
                          onKeyDown={handleEnterBlur}
                          onBlur={() => handleIncomeAmountBlur(incomeItem.id)}
                          aria-label="Income amount"
                        />
                      </div>
                      <button
                        className="ghost-button danger"
                        type="button"
                        onClick={() => handleRemoveIncome(incomeItem.id)}
                      >
                        {t('remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {showFixedExpensesPanel && (
              <div className="panel" dir="ltr">
                <div className="panel-header">
                  <h2>{t('fixedExpensesTitle')}</h2>
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={handleAddFixedExpense}
                  >
                    {t('addExpense')}
                  </button>
                </div>
                <div className="income-list">
                  {sortedFixedExpenses.map((expenseItem) => (
                    <div className="income-row" key={expenseItem.id}>
                      <input
                        className="income-name"
                        type="text"
                        dir="ltr"
                        value={expenseItem.name}
                        onChange={(event) =>
                          handleFixedExpenseNameChange(
                            expenseItem.id,
                            event.target.value
                          )
                        }
                        onKeyDown={handleEnterBlur}
                        aria-label="Fixed expense name"
                      />
                      <div className="income-amount">
                        <span className="currency">
                          {selectedCurrency.symbol}
                        </span>
                        <input
                          className="income-input"
                          inputMode="decimal"
                          value={expenseItem.amountInput}
                          onChange={(event) =>
                            handleFixedExpenseAmountChange(
                              expenseItem.id,
                              event.target.value
                            )
                          }
                          onKeyDown={handleEnterBlur}
                          onBlur={() =>
                            handleFixedExpenseAmountBlur(expenseItem.id)
                          }
                          aria-label="Fixed expense amount"
                        />
                      </div>
                      <button
                        className="ghost-button danger"
                        type="button"
                        onClick={() => handleRemoveFixedExpense(expenseItem.id)}
                      >
                        {t('remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="panel month-panel">
          <div className="panel-header">
            <h2>{activeTabLabel} {t('details')}</h2>
            <button className="ghost-button" type="button" disabled>
              {t('addEntry')}
            </button>
          </div>
          <div className="month-grid">
            <div className="summary-card">
              <div className="summary-header">
                <p className="summary-label">{t('income')}</p>
                <button
                  className="ghost-button small"
                  type="button"
                  onClick={() =>
                    setShowBonusInput((prev) => ({
                      ...prev,
                      [activeTab]: !prev[activeTab],
                    }))
                  }
                >
                  {t('addBonus')}
                </button>
              </div>
              <p className="summary-value">{monthIncomeTotalDisplay}</p>
              {bonusInputOpen && (
                <div className="bonus-input-row" dir="ltr">
                  <span className="currency">{selectedCurrency.symbol}</span>
                  <input
                    className="income-input"
                    inputMode="decimal"
                    value={activeBonus.amountInput}
                    onChange={(event) =>
                      handleBonusAmountChange(activeTab, event.target.value)
                    }
                    onKeyDown={handleBonusEnter(activeTab)}
                    onBlur={() => handleBonusAmountBlur(activeTab)}
                    aria-label={`${activeTabLabel} ${t('bonus')}`}
                  />
                </div>
              )}
              <p className="summary-subtext">{t('totalIncome')}</p>
            </div>
            <div className="summary-card">
              <div className="summary-header">
                <p className="summary-label">{t('fixedExpenses')}</p>
                <button
                  className="ghost-button small"
                  type="button"
                  onClick={() =>
                    setShowVariableExpensesPanel((prev) => ({
                      ...prev,
                      [activeTab]: !prev[activeTab],
                    }))
                  }
                >
                  {showVariableExpensesPanel[activeTab]
                    ? t('hideVariable')
                    : t('addVariable')}
                </button>
              </div>
              <p className="summary-value">{monthExpensesTotalDisplay}</p>
              <p className="summary-subtext">{t('fixedVariableSubtext')}</p>
            </div>
            <div className="summary-card highlight">
              <p className="summary-label">{t('remaining')}</p>
              <p className="summary-value">{monthRemainingDisplay}</p>
            </div>
          </div>
          {showVariableExpensesPanel[activeTab] && (
            <div className="panel" dir="ltr">
              <div className="panel-header">
                <h2>{t('variableExpenses')}</h2>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => handleAddVariableExpense(activeTab)}
                >
                  {t('addVariable')}
                </button>
              </div>
              <div className="income-list">
                {sortedVariableExpenses.map((expenseItem) => (
                  <div className="income-row" key={expenseItem.id}>
                    <input
                      className="income-name"
                      type="text"
                      dir="ltr"
                      value={expenseItem.name}
                      onChange={(event) =>
                        handleVariableExpenseNameChange(
                          activeTab,
                          expenseItem.id,
                          event.target.value
                        )
                      }
                      onKeyDown={handleEnterBlur}
                      aria-label="Variable expense name"
                    />
                    <div className="income-amount">
                      <span className="currency">{selectedCurrency.symbol}</span>
                      <input
                        className="income-input"
                        inputMode="decimal"
                        value={expenseItem.amountInput}
                        onChange={(event) =>
                          handleVariableExpenseAmountChange(
                            activeTab,
                            expenseItem.id,
                            event.target.value
                          )
                        }
                        onKeyDown={handleEnterBlur}
                        onBlur={() =>
                          handleVariableExpenseAmountBlur(
                            activeTab,
                            expenseItem.id
                          )
                        }
                        aria-label="Variable expense amount"
                      />
                    </div>
                    <button
                      className="ghost-button danger"
                      type="button"
                      onClick={() =>
                        handleRemoveVariableExpense(activeTab, expenseItem.id)
                      }
                    >
                      {t('remove')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="panel">
            <div className="panel-header">
              <h2>{activeTabLabel} {t('snapshot')}</h2>
              <button className="ghost-button" type="button" disabled>
                {t('viewAll')}
              </button>
            </div>
            <ul className="list">
              {monthEntries.map((entry) => (
                <li className="list-row" key={entry.id}>
                  <div>
                    <p className="list-title">{entry.name}</p>
                    <p className="list-subtitle">{entry.subtitle}</p>
                  </div>
                  <span
                    className={`amount ${
                      entry.isPositive ? 'positive' : 'negative'
                    }`}
                  >
                    {entry.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}

export default App
