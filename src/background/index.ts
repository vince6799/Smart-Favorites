import { setupContextMenus, handleContextMenuClick } from './contextMenu'
import { setupCommands } from './commands'
import { storageService } from '@/services/storage'
import { getFaviconUrl } from '@/utils/favicon'

// 初始化右键菜单
setupContextMenus()
handleContextMenuClick()

// 初始化快捷键
setupCommands()

// 启动时检查自动备份
checkAutoBackup()

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse)
    return true // 保持消息通道打开以支持异步响应
})

/**
 * 处理消息
 */
async function handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
        switch (request.type) {
            case 'ADD_BOOKMARK':
                // 添加书签
                const bookmark = await storageService.addBookmark({
                    title: request.data.title,
                    url: request.data.url,
                    categoryId: request.data.categoryId || 'default',
                    description: request.data.description || '',
                    tags: request.data.tags || [],
                    favicon: getFaviconUrl(request.data.url),
                    order: 0,
                    visitCount: 0,
                    lastVisit: null
                })
                sendResponse({ success: true, data: bookmark })
                break

            case 'GET_CURRENT_TAB':
                // 获取当前标签页信息
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
                sendResponse({
                    success: true,
                    data: {
                        url: tab.url,
                        title: tab.title,
                        favicon: tab.favIconUrl
                    }
                })
                break

            case 'INCREMENT_VISIT':
                // 增加访问次数
                await storageService.incrementVisitCount(request.data.id)
                sendResponse({ success: true })
                break

            default:
                sendResponse({ success: false, error: 'Unknown message type' })
        }
    } catch (error) {
        console.error('Message handling error:', error)
        sendResponse({ success: false, error: String(error) })
    }
}

/**
 * 检查并执行自动备份
 */
async function checkAutoBackup() {
    try {
        const data = await storageService.getData()
        const settings = data.settings

        if (!settings.autoBackup) return

        const lastBackup = data.lastBackup || 0
        const intervalMs = settings.backupInterval * 24 * 60 * 60 * 1000

        if (Date.now() - lastBackup > intervalMs) {
            console.log('Starting auto backup...')
            const timestamp = await storageService.performAutoBackup()
            console.log('Auto backup completed at:', new Date(timestamp).toLocaleString())
        }
    } catch (error) {
        console.error('Auto backup check failed:', error)
    }
}

// 扩展安装或更新时的处理
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('扩展已安装')
        // 可以打开欢迎页面
        // chrome.tabs.create({ url: '/welcome.html' })
    } else if (details.reason === 'update') {
        console.log('扩展已更新')
    }
})

console.log('Background script loaded')
