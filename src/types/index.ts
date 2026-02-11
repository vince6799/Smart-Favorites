// 分类接口
export interface Category {
    id: string                    // 唯一标识
    name: string                  // 分类名称
    parentId: string | null       // 父分类ID，null表示根分类
    icon: string                  // 图标名称/emoji
    color: string                 // 分类颜色（hex）
    order: number                 // 排序序号
    collapsed: boolean            // 是否折叠
    createdAt: number             // 创建时间戳
    updatedAt: number             // 更新时间戳
}

// 书签接口
export interface Bookmark {
    id: string                    // 唯一标识
    title: string                 // 书签标题
    url: string                   // 网址
    categoryId: string            // 所属分类ID
    description: string           // 备注说明
    tags: string[]                // 标签数组
    favicon: string               // 网站图标URL
    order: number                 // 排序序号
    visitCount: number            // 访问次数
    lastVisit: number | null      // 最后访问时间
    createdAt: number             // 添加时间戳
    updatedAt: number             // 更新时间戳
}

// 标签接口
export interface Tag {
    id: string                    // 唯一标识
    name: string                  // 标签名称
    color: string                 // 标签颜色
    count: number                 // 使用次数（计算得出）
    createdAt: number             // 创建时间戳
}

// 应用设置接口
export interface Settings {
    theme: 'light' | 'dark' | 'auto'       // 主题模式
    defaultView: 'list' | 'grid' | 'card'  // 默认视图
    sortBy: 'time' | 'name' | 'visit' | 'lastVisit'      // 排序方式
    showDescription: boolean                // 是否显示备注
    showFavicon: boolean                    // 是否显示图标
    enableShortcuts: boolean                // 是否启用快捷键
    autoBackup: boolean                     // 自动备份
    backupInterval: number                  // 备份间隔（天）
}

// 存储数据接口
export interface StorageData {
    categories: Category[]        // 所有分类
    bookmarks: Bookmark[]         // 所有书签
    tags: Tag[]                   // 所有标签
    settings: Settings            // 用户设置
    version: string               // 数据版本号
    lastBackup: number            // 最后备份时间
}

// 搜索过滤器
export interface SearchFilters {
    tags?: string[]
    categoryId?: string
    dateRange?: {
        start: number
        end: number
    }
}

// 导入导出数据格式
export interface ExportData {
    version: string
    exportDate: number
    data: {
        categories: Category[]
        bookmarks: Bookmark[]
        tags: Tag[]
    }
}
