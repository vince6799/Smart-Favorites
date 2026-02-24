/**
 * 创建右键菜单
 */
export function setupContextMenus() {
    chrome.runtime.onInstalled.addListener(() => {
        // 创建主菜单项
        chrome.contextMenus.create({
            id: 'save-to-bookmarks',
            title: chrome.i18n.getMessage('saveToBookmarks'),
            contexts: ['page', 'link', 'selection']
        })

        // 创建子菜单 - 快速保存到默认分类
        chrome.contextMenus.create({
            id: 'save-to-default',
            parentId: 'save-to-bookmarks',
            title: chrome.i18n.getMessage('saveToDefault'),
            contexts: ['page', 'link']
        })

        // 创建子菜单 - 选择分类
        chrome.contextMenus.create({
            id: 'save-with-category',
            parentId: 'save-to-bookmarks',
            title: chrome.i18n.getMessage('saveWithCategory'),
            contexts: ['page', 'link']
        })
    })
}

/**
 * 处理右键菜单点击
 */
import { storageService } from '@/services/storage'
import { getFaviconUrl } from '@/utils/favicon'

/**
 * 处理右键菜单点击
 */
export function handleContextMenuClick() {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        if (!tab) return

        const url = info.linkUrl || tab.url || ''
        const title = info.selectionText || tab.title || ''

        if (info.menuItemId === 'save-to-default') {
            // 直接保存到默认分类
            try {
                // 检查是否已存在
                const existing = await storageService.findBookmarkByUrl(url)
                if (existing) {
                    const categories = await storageService.getCategories()
                    const category = categories.find(c => c.id === existing.categoryId)
                    const categoryName = category ? category.name : chrome.i18n.getMessage('unknownCategory')

                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '/icons/icon-48.png',
                        title: chrome.i18n.getMessage('alreadyBookmarked'),
                        message: chrome.i18n.getMessage('existsIn', [categoryName])
                    })
                    return
                }

                await storageService.addBookmark({
                    title,
                    url,
                    categoryId: 'default',
                    description: '',
                    tags: [],
                    favicon: getFaviconUrl(url),
                    order: 0,
                    visitCount: 0,
                    lastVisit: null
                })

                // 显示通知
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '/icons/icon-48.png',
                    title: chrome.i18n.getMessage('saveSuccess'),
                    message: chrome.i18n.getMessage('saveMessage', [title])
                })
            } catch (error) {
                console.error('Save failed:', error)
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '/icons/icon-48.png',
                    title: chrome.i18n.getMessage('saveFailed'),
                    message: String(error)
                })
            }
        } else if (info.menuItemId === 'save-with-category') {
            // 打开选择分类弹窗
            // Use correct path consistent with build output
            chrome.windows.create({
                url: `/src/popup/index.html?action=add&mode=standalone&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
                type: 'popup',
                width: 400,
                height: 480
            })
        }
    })
}
