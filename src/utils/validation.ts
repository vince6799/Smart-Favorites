/**
 * 验证URL是否有效
 * @param url 待验证的URL
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * 验证书签数据
 * @param bookmark 书签对象
 * @returns 错误消息，无错误返回null
 */
export function validateBookmark(bookmark: {
    title: string
    url: string
}): string | null {
    if (!bookmark.title || bookmark.title.trim() === '') {
        return '标题不能为空'
    }

    if (!bookmark.url || bookmark.url.trim() === '') {
        return 'URL不能为空'
    }

    if (!isValidUrl(bookmark.url)) {
        return 'URL格式不正确'
    }

    return null
}

/**
 * 验证分类数据
 * @param category 分类对象
 * @returns 错误消息，无错误返回null
 */
export function validateCategory(category: {
    name: string
}): string | null {
    if (!category.name || category.name.trim() === '') {
        return '分类名称不能为空'
    }

    if (category.name.length > 50) {
        return '分类名称不能超过50个字符'
    }

    return null
}
