import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 格式化时间戳为可读字符串
 * @param timestamp 时间戳
 * @param pattern 格式模式
 * @returns 格式化后的字符串
 */
export function formatDate(timestamp: number, pattern = 'yyyy-MM-dd HH:mm'): string {
    return format(timestamp, pattern, { locale: zhCN })
}

/**
 * 格式化为相对时间（如：3分钟前）
 * @param timestamp 时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(timestamp: number): string {
    return formatDistanceToNow(timestamp, {
        addSuffix: true,
        locale: zhCN
    })
}
