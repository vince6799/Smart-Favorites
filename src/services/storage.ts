import type { StorageData, Category, Bookmark, Tag, Settings } from '@/types'
import { generateId } from '@/utils/id'

/**
 * 本地存储服务类
 */
export class StorageService {
    private readonly STORAGE_KEY = 'bookmark_extension_data'

    /**
     * 获取所有数据
     */
    async getData(): Promise<StorageData> {
        const result = await chrome.storage.local.get(this.STORAGE_KEY)
        const data = result[this.STORAGE_KEY] || this.getDefaultData()

        // 数据归一化：确保所有分类都有 collapsed 属性，并默认折叠（除了根节点或已设定的）
        if (data.categories) {
            data.categories = data.categories.map((c: any) => ({
                ...c,
                collapsed: typeof c.collapsed === 'boolean' ? c.collapsed : true
            }))
        }

        // 数据归一化：确保所有书签都有 tags 数组、visitCount 和 lastVisit
        if (data.bookmarks) {
            data.bookmarks = data.bookmarks.map((b: any) => ({
                ...b,
                tags: Array.isArray(b.tags) ? b.tags : [],
                visitCount: (typeof b.visitCount === 'number' && !isNaN(b.visitCount)) ? b.visitCount : 0,
                lastVisit: (typeof b.lastVisit === 'number' && !isNaN(b.lastVisit)) ? b.lastVisit : 0
            }))
        }

        return data
    }

    /**
     * 保存数据
     */
    async setData(data: StorageData): Promise<void> {
        await chrome.storage.local.set({
            [this.STORAGE_KEY]: {
                ...data,
                version: '1.0.0',
            }
        })
    }

    // ==================== 分类相关 ====================

    /**
     * 获取所有分类
     */
    async getCategories(): Promise<Category[]> {
        const data = await this.getData()
        return data.categories
    }

    /**
     * 添加分类
     */
    async addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
        const data = await this.getData()
        const newCategory: Category = {
            ...category,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        data.categories.push(newCategory)
        await this.setData(data)
        return newCategory
    }

    /**
     * 更新分类
     */
    async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
        const data = await this.getData()
        const index = data.categories.findIndex(c => c.id === id)
        if (index !== -1) {
            data.categories[index] = {
                ...data.categories[index],
                ...updates,
                updatedAt: Date.now()
            }
            await this.setData(data)
        }
    }

    /**
     * 删除分类（及其子分类和书签）
     */
    async deleteCategory(id: string): Promise<void> {
        const data = await this.getData()

        // 获取要删除的分类ID列表（包括所有子分类）
        const idsToDelete = this.getCategoryTreeIds(data.categories, id)

        // 删除分类
        data.categories = data.categories.filter(c => !idsToDelete.includes(c.id))

        // 删除这些分类下的所有书签
        data.bookmarks = data.bookmarks.filter(b => !idsToDelete.includes(b.categoryId))

        await this.setData(data)
    }

    /**
     * 获取分类树的所有ID（递归）
     */
    private getCategoryTreeIds(categories: Category[], parentId: string): string[] {
        const ids = [parentId]
        const children = categories.filter(c => c.parentId === parentId)
        children.forEach(child => {
            ids.push(...this.getCategoryTreeIds(categories, child.id))
        })
        return ids
    }

    // ==================== 书签相关 ====================

    /**
     * 获取所有书签
     */
    async getBookmarks(): Promise<Bookmark[]> {
        const data = await this.getData()
        return data.bookmarks
    }

    /**
     * 添加书签
     */
    async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
        const data = await this.getData()
        const newBookmark: Bookmark = {
            ...bookmark,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        data.bookmarks.push(newBookmark)
        await this.setData(data)
        return newBookmark
    }

    /**
     * 更新书签
     */
    async updateBookmark(id: string, updates: Partial<Bookmark>): Promise<void> {
        const data = await this.getData()
        const index = data.bookmarks.findIndex(b => b.id === id)
        if (index !== -1) {
            data.bookmarks[index] = {
                ...data.bookmarks[index],
                ...updates,
                updatedAt: Date.now()
            }
            await this.setData(data)
        }
    }

    /**
     * 删除书签
     */
    async deleteBookmark(id: string): Promise<void> {
        const data = await this.getData()
        data.bookmarks = data.bookmarks.filter(b => b.id !== id)
        await this.setData(data)
    }

    /**
     * 批量删除书签
     */
    async deleteBookmarks(ids: string[]): Promise<void> {
        const data = await this.getData()
        data.bookmarks = data.bookmarks.filter(b => !ids.includes(b.id))
        await this.setData(data)
    }

    /**
     * 增加书签访问次数
     */
    async incrementVisitCount(id: string): Promise<void> {
        const data = await this.getData()
        const bookmark = data.bookmarks.find(b => b.id === id)
        if (bookmark) {
            bookmark.visitCount = (Number(bookmark.visitCount) || 0) + 1
            bookmark.lastVisit = Date.now()
            await this.setData(data)
        }
    }

    /**
     * 根据URL查找书签
     */
    async findBookmarkByUrl(url: string): Promise<Bookmark | undefined> {
        const data = await this.getData()
        return data.bookmarks.find(b => b.url === url)
    }

    // ==================== 标签相关 ====================

    /**
     * 获取所有标签
     */
    async getTags(): Promise<Tag[]> {
        const data = await this.getData()
        return data.tags
    }

    /**
     * 添加标签
     */
    async addTag(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
        const data = await this.getData()
        const newTag: Tag = {
            ...tag,
            id: generateId(),
            createdAt: Date.now()
        }
        data.tags.push(newTag)
        await this.setData(data)
        return newTag
    }

    /**
     * 删除标签
     */
    async deleteTag(id: string): Promise<void> {
        const data = await this.getData()
        const tag = data.tags.find(t => t.id === id)
        if (tag) {
            // 从所有书签中移除该标签
            data.bookmarks.forEach(b => {
                b.tags = b.tags.filter(t => t !== tag.name)
            })
            // 删除标签
            data.tags = data.tags.filter(t => t.id !== id)
            await this.setData(data)
        }
    }

    // ==================== 设置相关 ====================

    /**
     * 获取设置
     */
    async getSettings(): Promise<Settings> {
        const data = await this.getData()
        return data.settings
    }

    /**
     * 更新设置
     */
    async updateSettings(updates: Partial<Settings>): Promise<void> {
        const data = await this.getData()
        data.settings = {
            ...data.settings,
            ...updates
        }
        await this.setData(data)
    }

    // ==================== 导入导出 ====================

    /**
     * 导出数据为JSON
     */
    async exportToJSON(): Promise<string> {
        const data = await this.getData()
        const exportData = {
            version: '1.0.0',
            exportDate: Date.now(),
            data: {
                categories: data.categories,
                bookmarks: data.bookmarks,
                tags: data.tags
            }
        }
        return JSON.stringify(exportData, null, 2)
    }

    /**
     * 从JSON导入数据
     */
    async importFromJSON(jsonStr: string): Promise<void> {
        try {
            const importData = JSON.parse(jsonStr)
            const data = await this.getData()

            // 合并数据（这里简单追加，实际可能需要处理ID冲突）
            data.categories.push(...importData.data.categories)
            data.bookmarks.push(...importData.data.bookmarks)
            data.tags.push(...importData.data.tags)

            await this.setData(data)
        } catch (error) {
            console.error('导入失败:', error)
            throw new Error('JSON格式不正确')
        }
    }

    /**
     * 获取默认数据
     */
    private getDefaultData(): StorageData {
        return {
            categories: [{
                id: 'default',
                name: '默认分类',
                parentId: null,
                icon: '📁',
                color: '#409EFF',
                order: 0,
                collapsed: false,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }],
            bookmarks: [],
            tags: [],
            settings: {
                theme: 'auto',
                defaultView: 'list',
                sortBy: 'time',
                showDescription: true,
                showFavicon: true,
                enableShortcuts: true,
                autoBackup: false,
                backupInterval: 7
            },
            version: '1.0.0',
            lastBackup: 0
        }
    }
}

// 导出单例
export const storageService = new StorageService()
