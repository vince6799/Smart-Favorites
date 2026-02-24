import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '@/types'
import { storageService } from '@/services/storage'
import { i18n, detectBrowserLocale, elementPlusLocales, type SupportedLocale } from '@/i18n'

// Keep a reactive reference to the current Element Plus locale for the config provider
import { ref as vueRef } from 'vue'
export const elLocale = vueRef(elementPlusLocales[detectBrowserLocale()])

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref<Settings>({
        theme: 'auto',
        defaultView: 'list',
        sortBy: 'time',
        showDescription: true,
        showFavicon: true,
        enableShortcuts: true,
        autoBackup: false,
        backupInterval: 7,
        language: detectBrowserLocale()
    })

    // 加载设置
    async function loadSettings() {
        const loaded = await storageService.getSettings()
        // If no language is persisted, use browser detection
        if (!loaded.language) {
            loaded.language = detectBrowserLocale()
        }
        settings.value = loaded
        // Apply persisted language
        applyLocale(settings.value.language)
    }

    // 更新设置
    async function updateSettings(updates: Partial<Settings>) {
        await storageService.updateSettings(updates)
        settings.value = { ...settings.value, ...updates }
        if (updates.language) {
            applyLocale(updates.language)
        }
    }

    function applyLocale(lang: SupportedLocale) {
        i18n.global.locale.value = lang
        elLocale.value = elementPlusLocales[lang]
    }

    return {
        settings,
        loadSettings,
        updateSettings
    }
})
