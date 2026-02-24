import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zh from './locales/zh.json'
import ja from './locales/ja.json'
import enLocale from 'element-plus/es/locale/lang/en'
import zhLocale from 'element-plus/es/locale/lang/zh-cn'
import jaLocale from 'element-plus/es/locale/lang/ja'

export type SupportedLocale = 'en' | 'zh' | 'ja'

/**
 * Detect the browser language and map it to one of the supported locales.
 * Falls back to 'en' if the browser language is not supported.
 */
export function detectBrowserLocale(): SupportedLocale {
    const lang = navigator.language || 'en'
    const prefix = lang.toLowerCase().split('-')[0]
    if (prefix === 'zh') return 'zh'
    if (prefix === 'ja') return 'ja'
    if (prefix === 'en') return 'en'
    return 'en'
}

export const elementPlusLocales: Record<SupportedLocale, any> = {
    en: enLocale,
    zh: zhLocale,
    ja: jaLocale
}

export const i18n = createI18n({
    legacy: false,
    locale: detectBrowserLocale(),
    fallbackLocale: 'en',
    messages: { en, zh, ja }
})

export default i18n
