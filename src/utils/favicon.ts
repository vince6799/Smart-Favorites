/**
 * 获取网站的 favicon URL
 * @param url 网站URL
 * @returns favicon URL
 */
export function getFaviconUrl(url: string): string {
    try {
        const urlObj = new URL(url)
        // 使用 Google 的 favicon 服务
        return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`
    } catch (error) {
        console.error('Invalid URL:', url)
        return ''
    }
}

/**
 * 获取域名
 * @param url 网站URL
 * @returns 域名
 */
export function getDomain(url: string): string {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname
    } catch (error) {
        return ''
    }
}
