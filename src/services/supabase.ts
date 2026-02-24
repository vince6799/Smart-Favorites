import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Settings, StorageData } from '@/types'

/**
 * Supabase 云端同步服务
 */
export class SupabaseService {
    private client: SupabaseClient | null = null
    private currentSettings: Settings | null = null

    /**
     * 初始化客户端
     */
    private initClient(settings: Settings): boolean {
        if (!settings.supabaseEnabled || !settings.supabaseUrl || !settings.supabaseAnonKey) {
            this.client = null
            return false
        }

        // 如果配置没变，复用客户端
        if (this.client &&
            this.currentSettings?.supabaseUrl === settings.supabaseUrl &&
            this.currentSettings?.supabaseAnonKey === settings.supabaseAnonKey) {
            return true
        }

        try {
            this.client = createClient(settings.supabaseUrl, settings.supabaseAnonKey)
            this.currentSettings = { ...settings }
            return true
        } catch (error) {
            console.error('Failed to init Supabase client:', error)
            this.client = null
            return false
        }
    }

    /**
     * 测试连接
     */
    async testConnection(settings: Settings): Promise<boolean> {
        const client = createClient(settings.supabaseUrl, settings.supabaseAnonKey)
        const tableName = settings.supabaseTable || 'bookmarks_backup'

        try {
            // 尝试读取一行数据来测试权限和连接
            const { error } = await client
                .from(tableName)
                .select('device_id')
                .limit(1)

            if (error) {
                // 如果是 404 表不存在，我们也认为连接是通的（只要能连上 Supabase）
                if (error.code === 'PGRST116' || error.message.includes('not found')) {
                    return true
                }
                throw error
            }
            return true
        } catch (error) {
            console.error('Supabase connection test failed:', error)
            throw error
        }
    }

    /**
     * 同步数据到云端
     */
    async uploadBackup(data: StorageData): Promise<void> {
        const settings = data.settings
        if (!this.initClient(settings)) {
            throw new Error('Supabase is not configured or enabled')
        }

        const tableName = settings.supabaseTable || 'bookmarks_backup'
        const deviceInfo = await this.getDeviceInfo()

        const backupPayload = {
            device_id: await this.getDeviceId(),
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            full_data: {
                categories: data.categories,
                bookmarks: data.bookmarks,
                tags: data.tags,
                version: data.version
            },
            updated_at: new Date().toISOString()
        }

        // 修改为直接插入新记录，不再使用 upsert 覆盖
        const { error } = await this.client!
            .from(tableName)
            .insert(backupPayload)

        if (error) {
            console.error('Supabase upload failed:', error)
            throw error
        }

        // 上传成功后，清理旧备份，仅保留最近 20 条
        await this.pruneOldBackups(settings)
    }

    /**
     * 清理旧备份记录，仅保留最近 20 条
     */
    private async pruneOldBackups(settings: Settings): Promise<void> {
        try {
            const maxBackups = settings.supabaseMaxBackups
            // 如果设置为 0，表示不限制记录数
            if (maxBackups === 0) return

            const tableName = settings.supabaseTable || 'bookmarks_backup'

            // 1. 获取所有记录的 ID，按时间降序排列
            const { data, error } = await this.client!
                .from(tableName)
                .select('id')
                .order('updated_at', { ascending: false })

            if (error) throw error
            if (!data || data.length <= maxBackups) return

            // 2. 识别需要删除的 ID（保留前 maxBackups 条）
            const idsToDelete = data.slice(maxBackups).map(item => item.id)

            // 3. 执行删除
            const { error: deleteError } = await this.client!
                .from(tableName)
                .delete()
                .in('id', idsToDelete)

            if (deleteError) throw deleteError

            console.log(`Pruned ${idsToDelete.length} old backups.`)
        } catch (error) {
            console.error('Failed to prune old backups:', error)
            // 清理失败不应影响主逻辑，仅记录错误
        }
    }

    /**
     * 获取最近的备份记录列表
     */
    async getRecentBackups(settings: Settings, limit: number = 100): Promise<any[]> {
        if (!this.initClient(settings)) {
            throw new Error('Supabase is not configured or enabled')
        }

        const tableName = settings.supabaseTable || 'bookmarks_backup'

        const { data, error } = await this.client!
            .from(tableName)
            .select('id, device_id, updated_at, browser, os, full_data')
            .order('updated_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Supabase fetch backups failed:', error)
            throw error
        }

        return data || []
    }

    /**
     * 从云端下载具体某条备份数据
     */
    async downloadBackup(settings: Settings): Promise<any> {
        // 保留原接口用于默认“还原最新”逻辑，改为获取最新一条
        const backups = await this.getRecentBackups(settings, 1)
        return backups[0]?.full_data
    }

    /**
     * 获取设备和浏览器信息
     */
    private async getDeviceInfo(): Promise<{ browser: string, os: string }> {
        const ua = navigator.userAgent
        let browser = 'Unknown'
        if (ua.includes('Edg/')) browser = 'Edge'
        else if (ua.includes('Chrome')) browser = 'Chrome'
        else if (ua.includes('Safari')) browser = 'Safari'
        else if (ua.includes('Firefox')) browser = 'Firefox'

        let os = 'Unknown'
        try {
            const info = await chrome.runtime.getPlatformInfo()
            const osMap: Record<string, string> = {
                'mac': 'Mac',
                'win': 'Windows',
                'android': 'Android',
                'cros': 'ChromeOS',
                'linux': 'Linux',
                'openbsd': 'OpenBSD'
            }
            os = osMap[info.os] || info.os
        } catch (e) {
            if (ua.includes('Mac')) os = 'Mac'
            else if (ua.includes('Win')) os = 'Windows'
            else if (ua.includes('Linux')) os = 'Linux'
        }

        return { browser, os }
    }

    /**
     * 获取设备标识（简单基于 extension id）
     */
    private async getDeviceId(): Promise<string> {
        // 在扩展中，我们可以用 chrome.runtime.id 或者特定的本地存储 ID
        // 这里为了演示，我们先尝试从 storage 获取一个持久 ID，没有就生成一个
        const key = 'supabase_backup_device_id'
        const result = await chrome.storage.local.get(key)
        let id = result[key]

        if (!id) {
            id = Date.now().toString(36) + Math.random().toString(36).substring(2)
            await chrome.storage.local.set({ [key]: id })
        }

        return id
    }

    /**
     * 生成初始化 SQL
     */
    generateInitialSql(tableName: string): string {
        return `-- 1. 创建备份表\ncreate table if not exists public.${tableName} (\n  id bigint primary key generated always as identity,\n  device_id text,\n  browser text,\n  os text,\n  full_data jsonb not null,\n  updated_at timestamptz default now()\n);\n\n-- 2. 开启行级安全 (RLS)\nalter table public.${tableName} enable row level security;\n\n-- 3. 配置访问权限 (RLS Policies)\n-- 允许匿名查看所有备份\ncreate policy "Enable select for anonymous" \non public.${tableName} for select \nto anon \nusing (true);\n\n-- 允许匿名上传备份\ncreate policy "Enable insert for anonymous" \non public.${tableName} for insert \nto anon \nwith check (true);`
    }
}

export const supabaseService = new SupabaseService()
