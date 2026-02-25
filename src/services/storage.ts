import type { StorageData, Category, Bookmark, Tag, Settings } from '@/types'
import { generateId } from '@/utils/id'
import { supabaseService } from './supabase'

/**
 * 本地存储服务类
 */
export class StorageService {
    private readonly STORAGE_KEY = 'bookmark_extension_data'
    private readonly AUTO_BACKUP_KEY = 'bookmark_auto_backup'

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

        // 数据归一化：Supabase 设置
        if (data.settings) {
            data.settings.supabaseEnabled = !!data.settings.supabaseEnabled
            data.settings.supabaseUrl = data.settings.supabaseUrl || ''
            data.settings.supabaseAnonKey = data.settings.supabaseAnonKey || ''
            data.settings.supabaseTable = data.settings.supabaseTable || 'bookmarks_backup'

            if (typeof data.settings.supabaseSyncInterval !== 'number') {
                data.settings.supabaseSyncInterval = 7
            }
            if (typeof data.settings.supabaseMaxBackups !== 'number') {
                data.settings.supabaseMaxBackups = 20
            }
        }

        if (typeof data.lastCloudSync !== 'number') {
            data.lastCloudSync = 0
        }

        if (typeof data.lastBackup !== 'number') {
            data.lastBackup = 0
        }

        return data
    }

    /**
     * 保存数据
     */
    async setData(data: StorageData): Promise<void> {
        // 使用深度克隆确保数据是纯粹的 JSON 格式，不受 Vue 3 响应式代理（Proxy）影响
        const cleanData = JSON.parse(JSON.stringify({
            ...data,
            version: '1.0.0'
        }))

        await chrome.storage.local.set({
            [this.STORAGE_KEY]: cleanData
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

        // 自动注册新标签
        if (newBookmark.tags && newBookmark.tags.length > 0) {
            this.ensureTagsExist(data, newBookmark.tags)
        }

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

            // 自动注册新标签
            if (updates.tags && updates.tags.length > 0) {
                this.ensureTagsExist(data, updates.tags)
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
        return {
            ...data.settings,
            lastBackup: data.lastBackup,
            lastCloudSync: data.lastCloudSync
        }
    }

    /**
     * 更新设置
     */
    async updateSettings(updates: Partial<Settings>): Promise<void> {
        const data = await this.getData()

        const { lastBackup, lastCloudSync, ...otherUpdates } = updates

        data.settings = {
            ...data.settings,
            ...otherUpdates
        }

        if (typeof lastBackup === 'number') data.lastBackup = lastBackup
        if (typeof lastCloudSync === 'number') data.lastCloudSync = lastCloudSync

        await this.setData(data)
    }

    /**
     * 执行自动备份
     */
    async performAutoBackup(): Promise<number> {
        const data = await this.getData()
        const timestamp = Date.now()

        // 保存本地备份数据
        await chrome.storage.local.set({
            [this.AUTO_BACKUP_KEY]: data
        })

        // 更新最后备份时间
        data.lastBackup = timestamp
        await this.setData(data)

        // 如果开启了云端同步，则尝试同步
        if (data.settings.supabaseEnabled) {
            try {
                await this.syncToCloud()
            } catch (error) {
                console.error('Auto cloud sync failed:', error)
            }
        }

        return timestamp
    }

    /**
     * 同步到云端
     */
    async syncToCloud(): Promise<void> {
        const data = await this.getData()
        if (!data.settings.supabaseEnabled) return

        await supabaseService.uploadBackup(data)

        // 更新最后同步时间
        data.lastCloudSync = Date.now()
        await this.setData(data)
    }

    /**
     * 从云端还原
     */
    async restoreFromCloud(data?: any): Promise<void> {
        const cloudData = data || await supabaseService.downloadBackup(await this.getSettings())
        if (cloudData) {
            const currentData = await this.getData()
            const newData: StorageData = {
                ...currentData,
                categories: cloudData.categories,
                bookmarks: cloudData.bookmarks,
                tags: cloudData.tags,
                lastCloudSync: Date.now()
            }
            await this.setData(newData)
        } else {
            throw new Error('No cloud backup found')
        }
    }

    /**
     * 从自动备份还原
     */
    async restoreFromAutoBackup(): Promise<void> {
        const result = await chrome.storage.local.get(this.AUTO_BACKUP_KEY)
        const backupData = result[this.AUTO_BACKUP_KEY]

        if (backupData) {
            await this.setData(backupData)
        } else {
            throw new Error('No backup found')
        }
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
     * 导出为 HTML (Netscape 格式)
     */
    async exportToHTML(): Promise<string> {
        const data = await this.getData();
        const { categories, bookmarks } = data;

        // 检查分类（及其所有子分类）是否包含书签
        const hasBookmarksCheck = (categoryId: string): boolean => {
            if (bookmarks.some(b => b.categoryId === categoryId)) return true;
            const subCats = categories.filter(c => c.parentId === categoryId);
            return subCats.some(sc => hasBookmarksCheck(sc.id));
        };

        // 构建分类树内容
        const buildTreeHtml = (parentId: string | null, level: number): string => {
            const indent = '    '.repeat(level);
            // 获取该分类下的子分类
            const subCategories = categories
                .filter(c => c.parentId === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 获取该分类下的书签
            const categoryBookmarks = bookmarks
                .filter(b => b.categoryId === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            let html = '';

            // 导出分类下的书签
            for (const b of categoryBookmarks) {
                const addDate = Math.floor((b.createdAt || Date.now()) / 1000);
                const tagsCsv = b.tags ? b.tags.join(',') : '';
                // 写入 DT/A 标签，包含 URL, 创建时间, 标签和图标
                html += `${indent}<DT><A HREF="${b.url}" ADD_DATE="${addDate}" TAGS="${tagsCsv}" ICON="${b.favicon || ''}">${b.title}</A>\n`;
                if (b.description) {
                    html += `${indent}<DD>${b.description}\n`;
                }
            }

            // 递归导出子分类
            for (const cat of subCategories) {
                // 如果该分类及其子分类没有任何书签，则跳过
                if (!hasBookmarksCheck(cat.id)) continue;

                const addDate = Math.floor((cat.createdAt || Date.now()) / 1000);
                html += `${indent}<DT><H3 ADD_DATE="${addDate}" LAST_MODIFIED="${addDate}">${cat.name}</H3>\n`;
                html += `${indent}<DL><p>\n`;
                html += buildTreeHtml(cat.id, level + 1);
                html += `${indent}</DL><p>\n`;
            }

            return html;
        };

        const htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and classified.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>智能收藏夹 - 书签导出</TITLE>
<style>
    :root {
        --color-primary: #409EFF;
        --color-text: #303133;
        --color-text-light: #909399;
        --color-bg: #f5f7fa;
        --color-border: #e4e7ed;
        --color-card: #ffffff;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: var(--color-bg);
        color: var(--color-text);
        margin: 0;
        padding: 40px 20px;
        line-height: 1.6;
    }
    .container {
        max-width: 900px;
        margin: 0 auto;
        background: var(--color-card);
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    h1 {
        font-size: 28px;
        margin-top: 0;
        margin-bottom: 40px;
        color: var(--color-primary);
        display: flex;
        align-items: center;
        gap: 12px;
    }
    h1::before {
        content: "🔖";
    }
    dl {
        margin: 0;
        padding-left: 24px;
        border-left: 2px solid var(--color-bg);
        transition: all 0.3s ease;
        overflow: hidden;
    }
    .collapsed + dl {
        display: none;
    }
    dt {
        margin: 12px 0;
        list-style: none;
    }
    h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 32px 0 16px -24px;
        padding: 8px 16px;
        background: var(--color-bg);
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        transition: background 0.2s;
    }
    h3:hover {
        background: var(--color-border);
    }
    h3::before {
        content: "▼";
        font-size: 12px;
        transition: transform 0.2s;
    }
    h3.collapsed::before {
        transform: rotate(-90deg);
    }
    h3::after {
        content: "📁";
        margin-left: 4px;
    }
    a {
        text-decoration: none;
        color: var(--color-text);
        font-weight: 500;
        transition: color 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    a:hover {
        color: var(--color-primary);
    }
    dd {
        font-size: 13px;
        color: var(--color-text-light);
        margin: -8px 0 16px 24px;
    }
    .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid var(--color-border);
        font-size: 12px;
        color: var(--color-text-light);
        text-align: center;
    }
</style>
<div class="container">
    <H1>智能收藏夹</H1>
    <DL><p>
    ${buildTreeHtml(null, 1)}
    </DL><p>
    <div class="footer">
        导出于 ${new Date().toLocaleString()} - 由智能收藏夹插件生成
    </div>
</div>
<script>
    document.querySelectorAll('h3').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('collapsed');
        });
    });
</script>
`;

        return htmlContent;
    }

    /**
     * 从JSON导入数据
     */
    async importFromJSON(jsonStr: string): Promise<{ categories: number, bookmarks: number }> {
        try {
            const importData = JSON.parse(jsonStr)
            if (!importData.data) {
                throw new Error('Invalid JSON format')
            }
            return await this.mergeData(importData.data)
        } catch (error) {
            console.error('导入失败:', error)
            throw new Error('JSON格式不正确')
        }
    }

    /**
     * 合并外部数据到当前存储
     * 处理分类层级映射和书签去重
     */
    async mergeData(incoming: { categories?: Category[], bookmarks?: Bookmark[], tags?: Tag[] }): Promise<{ categories: number, bookmarks: number }> {
        const data = await this.getData()
        const idMap: Record<string, string> = {} // incomingId -> existing/newId
        let addedCategories = 0
        let addedBookmarks = 0

        // 1. 处理分类
        if (incoming.categories) {
            // 确保按层级关系排序（父分类在前），或者多次遍历
            // 这里假设输入数据基本有序，或独立处理
            idMap['default'] = 'default'

            // 首先识别已存在的 ID 或同名冲突
            for (const incomingCat of incoming.categories) {
                const mappedParentId = incomingCat.parentId ? idMap[incomingCat.parentId] || incomingCat.parentId : null

                // 查找是否存在同名同父级的分类
                const existing = data.categories.find(c =>
                    c.name === incomingCat.name &&
                    c.parentId === mappedParentId
                )

                if (existing) {
                    idMap[incomingCat.id] = existing.id
                } else {
                    const newId = generateId()
                    idMap[incomingCat.id] = newId
                    data.categories.push({
                        ...incomingCat,
                        id: newId,
                        parentId: mappedParentId,
                        updatedAt: Date.now()
                    })
                    addedCategories++
                }
            }
        }

        // 2. 处理书签
        if (incoming.bookmarks) {
            for (const incomingBM of incoming.bookmarks) {
                const mappedCategoryId = incomingBM.categoryId ? idMap[incomingBM.categoryId] || incomingBM.categoryId : 'default'

                // 查找同一分类下是否存在相同 URL 的书签
                const existing = data.bookmarks.find(b =>
                    b.url === incomingBM.url &&
                    b.categoryId === mappedCategoryId
                )

                if (!existing) {
                    const newBookmark: Bookmark = {
                        ...incomingBM,
                        id: generateId(),
                        categoryId: mappedCategoryId,
                        updatedAt: Date.now(),
                        visitCount: incomingBM.visitCount || 0,
                        lastVisit: incomingBM.lastVisit || null
                    }
                    data.bookmarks.push(newBookmark)
                    addedBookmarks++

                    // 确保标签存在
                    if (newBookmark.tags && newBookmark.tags.length > 0) {
                        this.ensureTagsExist(data, newBookmark.tags)
                    }
                }
            }
        }

        // 3. 处理标签 (如果 JSON 包含独立标签定义)
        if (incoming.tags) {
            this.ensureTagsExist(data, incoming.tags.map(t => t.name))
        }

        await this.setData(data)
        return { categories: addedCategories, bookmarks: addedBookmarks }
    }

    /**
     * 确保标签存在于全局列表中
     */
    private ensureTagsExist(data: StorageData, tagNames: string[]): void {
        const existingTags = data.tags.map(t => t.name)
        tagNames.forEach(name => {
            if (name && !existingTags.includes(name)) {
                data.tags.push({
                    id: generateId(),
                    name: name,
                    color: this.getRandomTagColor(),
                    count: 0,
                    createdAt: Date.now()
                })
            }
        })
    }

    /**
     * 获取随机标签颜色
     */
    private getRandomTagColor(): string {
        const colors = [
            '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
            '#909399', '#ff6b6b', '#4ecdc4', '#45b7d1',
            '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe'
        ]
        return colors[Math.floor(Math.random() * colors.length)]
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
                backupInterval: 7,
                language: 'en',
                supabaseEnabled: false,
                supabaseUrl: '',
                supabaseAnonKey: '',
                supabaseTable: 'bookmarks_backup',
                supabaseSyncInterval: 7,
                supabaseMaxBackups: 20,
                lastBackup: 0,
                lastCloudSync: 0
            },
            version: '1.0.0',
            lastBackup: 0,
            lastCloudSync: 0
        }
    }
}

// 导出单例
export const storageService = new StorageService()
