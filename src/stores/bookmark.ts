import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Bookmark } from '@/types'
import { storageService } from '@/services/storage'
import { useCategoryStore } from './category'

export const useBookmarkStore = defineStore('bookmark', () => {
    const bookmarks = ref<Bookmark[]>([])

    // 加载所有书签
    async function loadBookmarks() {
        bookmarks.value = await storageService.getBookmarks()
    }

    // 添加书签
    async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) {
        // 检查重复
        const existing = await storageService.findBookmarkByUrl(bookmark.url)
        if (existing) {
            const categoryStore = useCategoryStore()
            if (categoryStore.categories.length === 0) {
                await categoryStore.loadCategories()
            }
            const category = categoryStore.categories.find(c => c.id === existing.categoryId)
            const categoryName = category ? category.name : '未知分类'
            throw new Error(`该网址已收藏在【${categoryName}】分类下`)
        }

        const newBookmark = await storageService.addBookmark(bookmark)
        bookmarks.value.push(newBookmark)
        return newBookmark
    }

    // 更新书签
    async function updateBookmark(id: string, updates: Partial<Bookmark>) {
        await storageService.updateBookmark(id, updates)
        const index = bookmarks.value.findIndex(b => b.id === id)
        if (index !== -1) {
            bookmarks.value[index] = { ...bookmarks.value[index], ...updates }
        }
    }

    // 删除书签
    async function deleteBookmark(id: string) {
        await storageService.deleteBookmark(id)
        bookmarks.value = bookmarks.value.filter(b => b.id !== id)
    }

    // 增加访问次数
    async function incrementVisitCount(id: string) {
        // 先在本地状态更新，保证 UI 响应
        const bookmark = bookmarks.value.find(b => b.id === id)
        if (bookmark) {
            bookmark.visitCount = (bookmark.visitCount || 0) + 1
            bookmark.lastVisit = Date.now()
        }

        // 发送消息给后台脚本，确保在 Popup 关闭后也能持久化
        chrome.runtime.sendMessage({
            type: 'INCREMENT_VISIT',
            data: { id }
        })
    }

    return {
        bookmarks,
        loadBookmarks,
        addBookmark,
        updateBookmark,
        deleteBookmark,
        incrementVisitCount
    }
})
