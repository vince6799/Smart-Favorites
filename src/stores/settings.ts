import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Settings } from '@/types'
import { storageService } from '@/services/storage'

export const useSettingsStore = defineStore('settings', () => {
    const settings = ref<Settings>({
        theme: 'auto',
        defaultView: 'list',
        sortBy: 'time',
        showDescription: true,
        showFavicon: true,
        enableShortcuts: true,
        autoBackup: false,
        backupInterval: 7
    })

    // 加载设置
    async function loadSettings() {
        settings.value = await storageService.getSettings()
    }

    // 更新设置
    async function updateSettings(updates: Partial<Settings>) {
        await storageService.updateSettings(updates)
        settings.value = { ...settings.value, ...updates }
    }

    return {
        settings,
        loadSettings,
        updateSettings
    }
})
