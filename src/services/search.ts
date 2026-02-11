import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Bookmark, SearchFilters } from '@/types'

/**
 * 搜索配置
 */
const fuseOptions: IFuseOptions<Bookmark> = {
    keys: [
        { name: 'title', weight: 0.4 },
        { name: 'url', weight: 0.2 },
        { name: 'description', weight: 0.2 },
        { name: 'tags', weight: 0.2 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
}

/**
 * 搜索书签
 */
export function searchBookmarks(
    bookmarks: Bookmark[],
    query: string,
    filters?: SearchFilters
): Bookmark[] {
    let result = bookmarks

    // 应用过滤器
    if (filters) {
        if (filters.categoryId) {
            result = result.filter(b => b.categoryId === filters.categoryId)
        }

        if (filters.tags && filters.tags.length > 0) {
            result = result.filter(b =>
                filters.tags!.some(tag => b.tags?.includes(tag))
            )
        }

        if (filters.dateRange) {
            result = result.filter(b =>
                b.createdAt >= filters.dateRange!.start &&
                b.createdAt <= filters.dateRange!.end
            )
        }
    }

    // 如果有搜索关键词，使用Fuse.js进行模糊搜索
    if (query && query.trim()) {
        const fuse = new Fuse(result, fuseOptions)
        const searchResults = fuse.search(query.trim())
        return searchResults.map(r => r.item)
    }

    return result
}

/**
 * 高亮搜索结果
 */
export function highlightMatches(text: string, query: string): string {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
}
