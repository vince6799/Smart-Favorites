import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Category } from '@/types'
import { storageService } from '@/services/storage'
import { useBookmarkStore } from './bookmark'

export const useCategoryStore = defineStore('category', () => {
    const categories = ref<Category[]>([])

    // 加载所有分类
    async function loadCategories() {
        console.log('CategoryStore: Loading categories...')
        categories.value = await storageService.getCategories()
        console.log('CategoryStore: Categories loaded:', categories.value)
    }

    // 添加分类
    async function addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
        const newCategory = await storageService.addCategory(category)
        categories.value.push(newCategory)
        return newCategory
    }

    // 更新分类
    async function updateCategory(id: string, updates: Partial<Category>) {
        await storageService.updateCategory(id, updates)
        const index = categories.value.findIndex(c => c.id === id)
        if (index !== -1) {
            categories.value[index] = { ...categories.value[index], ...updates }
        }
    }

    // 删除分类
    async function deleteCategory(id: string) {
        // 将该分类下的书签移动到默认分类
        const bookmarkStore = useBookmarkStore()

        // 确保书签数据已加载
        if (bookmarkStore.bookmarks.length === 0) {
            await bookmarkStore.loadBookmarks()
        }

        const bookmarksToMove = bookmarkStore.bookmarks.filter((b: any) => b.categoryId === id)

        // 并行更新
        await Promise.all(bookmarksToMove.map(b =>
            bookmarkStore.updateBookmark(b.id, { categoryId: 'default' })
        ))

        await storageService.deleteCategory(id)
        // 重新加载以确保子分类也被删除
        await loadCategories()
    }

    return {
        categories,
        loadCategories,
        addCategory,
        updateCategory,
        deleteCategory
    }
})
