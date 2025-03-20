import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Language } from '@/i18n/config'
import i18n from '@/i18n/config'

interface LanguageStore {
  language: Language
  setLanguage: (language: Language) => void
}

type State = {
  language: Language
}

type Actions = {
  setLanguage: (language: Language) => void
}

export const useLanguage = create<LanguageStore>()(
  persist<State & Actions>(
    (set) => ({
      language: i18n.language as Language,
      setLanguage: (language: Language) => {
        i18n.changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'language-storage',
    }
  )
) 