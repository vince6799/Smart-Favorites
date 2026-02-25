import type { Category, Bookmark } from '@/types'
import { storageService } from './storage'
import { generateId } from '@/utils/id'
import { getFaviconUrl } from '@/utils/favicon'

/**
 * 从浏览器书签导入
 */
export async function importFromBrowser(): Promise<{ categories: number, bookmarks: number }> {
    try {
        // 获取浏览器书签树
        const tree = await chrome.bookmarks.getTree()

        if (!tree || tree.length === 0) {
            throw new Error('无法读取浏览器书签')
        }

        // 递归转换为我们的数据结构
        const { categories, bookmarks } = convertBookmarkTree(tree[0])

        // 使用 mergeData 进行智能合并与去重
        return await storageService.mergeData({ categories, bookmarks })
    } catch (error) {
        console.error('导入失败:', error)
        throw error
    }
}

/**
 * 递归转换书签树
 */
function convertBookmarkTree(
    node: chrome.bookmarks.BookmarkTreeNode,
    parentId: string | null = null
): { categories: Category[], bookmarks: Bookmark[] } {
    const categories: Category[] = []
    const bookmarks: Bookmark[] = []

    // 跳过根节点和一些特殊节点
    if (node.id === '0' || !node.title) {
        if (node.children) {
            node.children.forEach(child => {
                const result = convertBookmarkTree(child, parentId)
                categories.push(...result.categories)
                bookmarks.push(...result.bookmarks)
            })
        }
        return { categories, bookmarks }
    }

    if (node.children) {
        // 这是一个文件夹
        const category: Category = {
            id: generateId(),
            name: node.title,
            parentId,
            icon: '📁',
            color: '#409EFF',
            order: node.index || 0,
            collapsed: false,
            createdAt: node.dateAdded || Date.now(),
            updatedAt: Date.now()
        }
        categories.push(category)

        // 递归处理子节点
        node.children.forEach(child => {
            const result = convertBookmarkTree(child, category.id)
            categories.push(...result.categories)
            bookmarks.push(...result.bookmarks)
        })
    } else if (node.url) {
        // 这是一个书签
        const bookmark: Bookmark = {
            id: generateId(),
            title: node.title,
            url: node.url,
            categoryId: parentId || 'default',
            description: '',
            tags: [],
            favicon: getFaviconUrl(node.url),
            order: node.index || 0,
            visitCount: 0,
            lastVisit: null,
            createdAt: node.dateAdded || Date.now(),
            updatedAt: Date.now()
        }
        bookmarks.push(bookmark)
    }

    return { categories, bookmarks }
}

/**
 * 导出到浏览器书签
 */
export async function exportToBrowser(categoryId?: string): Promise<number> {
    try {
        const categories = await storageService.getCategories()
        const bookmarks = await storageService.getBookmarks()

        // 过滤指定分类
        const targetCategories = categoryId
            ? filterCategoryTree(categories, categoryId)
            : categories

        const categoryIds = targetCategories.map(c => c.id)
        const targetBookmarks = bookmarks.filter(b => categoryIds.includes(b.categoryId))

        // 在浏览器书签栏中创建根文件夹
        const rootFolder = await chrome.bookmarks.create({
            parentId: '1',  // '1' 是书签栏
            title: `智能收藏夹导出 - ${new Date().toLocaleDateString()}`
        })

        // 递归创建文件夹和书签
        await createBrowserBookmarkTree(
            targetCategories,
            targetBookmarks,
            null,
            rootFolder.id
        )

        return targetBookmarks.length
    } catch (error) {
        console.error('导出失败:', error)
        throw error
    }
}

/**
 * 过滤分类树
 */
function filterCategoryTree(categories: Category[], rootId: string): Category[] {
    const result: Category[] = []
    const addCategory = (id: string) => {
        const category = categories.find(c => c.id === id)
        if (category) {
            result.push(category)
            categories.filter(c => c.parentId === id).forEach(c => addCategory(c.id))
        }
    }
    addCategory(rootId)
    return result
}

/**
 * 递归创建浏览器书签树
 */
async function createBrowserBookmarkTree(
    categories: Category[],
    bookmarks: Bookmark[],
    parentCategoryId: string | null,
    parentBrowserId: string
): Promise<void> {
    // 创建当前层级的分类
    const currentCategories = categories
        .filter(c => c.parentId === parentCategoryId)
        .sort((a, b) => a.order - b.order)

    for (const category of currentCategories) {
        // 创建文件夹
        const folder = await chrome.bookmarks.create({
            parentId: parentBrowserId,
            title: category.name
        })

        // 添加该分类下的书签
        const categoryBookmarks = bookmarks
            .filter(b => b.categoryId === category.id)
            .sort((a, b) => a.order - b.order)

        for (const bookmark of categoryBookmarks) {
            await chrome.bookmarks.create({
                parentId: folder.id,
                title: bookmark.title,
                url: bookmark.url
            })
        }

        // 递归处理子分类
        await createBrowserBookmarkTree(categories, bookmarks, category.id, folder.id)
    }
}
