import { storageService } from '@/services/storage'

/**
 * 设置快捷键命令
 */
export function setupCommands() {
    chrome.commands.onCommand.addListener(async (command) => {
        if (command === 'quick_search') {
            const settings = await storageService.getSettings()
            if (settings.enableShortcuts === false) return

            // 打开弹窗并聚焦搜索框
            chrome.action.openPopup()
        }
    })
}
