<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('settings.autoBackup')"
    width="520px"
    :style="{ maxHeight: '90vh' }"
    @close="handleClose"
  >
    <div class="backup-container">
      <el-form :model="formData" label-width="140px">
        <!-- Local Backup -->
        <el-form-item :label="t('settings.autoBackup')">
          <el-switch v-model="formData.autoBackup" />
        </el-form-item>

        <el-form-item v-if="formData.autoBackup" :label="t('settings.backupInterval')">
          <el-input-number
            v-model="formData.backupInterval"
            :min="1"
            :max="30"
          />
          <span style="margin-left: 8px;">{{ t('settings.backupIntervalUnit') }}</span>
        </el-form-item>

        <el-form-item :label="t('settings.lastBackup')">
          <div class="backup-status-row">
            <span class="timestamp">
              {{ settingsStore.settings.lastBackup ? new Date(settingsStore.settings.lastBackup).toLocaleString() : t('settings.neverBackup') }}
            </span>
          </div>
          <div class="backup-actions-row">
            <el-button size="small" @click="handleManualBackup">{{ t('settings.backupNow') }}</el-button>
            <el-button size="small" type="danger" plain @click="handleRestoreBackup">{{ t('settings.restore') }}</el-button>
          </div>
        </el-form-item>

        <el-divider>{{ t('settings.supabase.title') }}</el-divider>
        
        <!-- Cloud Backup (Supabase) -->
        <el-form-item :label="t('settings.supabase.enabled')">
          <el-switch v-model="formData.supabaseEnabled" />
        </el-form-item>

        <template v-if="formData.supabaseEnabled">
          <el-form-item :label="t('settings.supabase.url')">
            <el-input v-model="formData.supabaseUrl" placeholder="https://xxx.supabase.co" />
          </el-form-item>
          <el-form-item :label="t('settings.supabase.anonKey')">
            <el-input v-model="formData.supabaseAnonKey" type="password" show-password />
          </el-form-item>
          <el-form-item :label="t('settings.supabase.table')">
            <el-input v-model="formData.supabaseTable" />
          </el-form-item>

          <el-form-item :label="t('settings.supabase.syncInterval')">
            <el-input-number
              v-model="formData.supabaseSyncInterval"
              :min="1"
              :max="30"
            />
            <span style="margin-left: 8px;">{{ t('settings.supabase.syncIntervalUnit') }}</span>
          </el-form-item>

          <el-form-item :label="t('settings.supabase.maxBackups')">
            <el-input-number
              v-model="formData.supabaseMaxBackups"
              :min="0"
              :max="1000"
            />
            <span style="margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
              {{ t('settings.supabase.maxBackupsTip') }}
            </span>
          </el-form-item>
          
          <el-form-item :label="t('settings.supabase.lastSync')">
            <div class="backup-status-row">
              <span class="timestamp">
                {{ settingsStore.settings.lastCloudSync ? new Date(settingsStore.settings.lastCloudSync).toLocaleString() : t('settings.neverBackup') }}
              </span>
            </div>
            <div class="backup-actions-row">
              <el-button size="small" @click="handleSyncCloud">{{ t('settings.supabase.syncNow') }}</el-button>
              <el-button size="small" type="danger" plain @click="handleRestoreCloud">{{ t('settings.supabase.restoreCloud') }}</el-button>
            </div>
          </el-form-item>

          <el-form-item :label="t('settings.supabase.test')">
            <div class="backup-status-row">
              <el-button size="small" type="primary" plain @click="handleTestSupabase">{{ t('settings.supabase.test') }}</el-button>
              <el-button size="small" @click="handleCopySql">{{ t('settings.supabase.copySql') }}</el-button>
            </div>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('settings.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ t('settings.save') }}</el-button>
    </template>

    <!-- Cloud History Dialog -->
    <el-dialog
      v-model="historyVisible"
      :title="t('settings.supabase.history')"
      width="600px"
      append-to-body
    >
      <div v-loading="loadingHistory" style="min-height: 100px;">
        <div v-if="backupHistory.length === 0 && !loadingHistory" class="empty-history">
          {{ t('settings.supabase.noHistory') }}
        </div>
        <el-table v-else :data="backupHistory" size="small" style="width: 100%">
          <el-table-column :label="t('common.time')" width="160">
            <template #default="{ row }">
              {{ new Date(row.updated_at).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column :label="t('settings.supabase.browser')" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.browser || '?' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('settings.supabase.os')" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="success">{{ row.os || '?' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="ID" width="80">
            <template #default="{ row }">
              <span style="font-family: monospace; font-size: 11px;">{{ (row.device_id || '').substring(0, 4) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="" min-width="80" align="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="handleSelectRestore(row.full_data)"
              >
                {{ t('settings.restore') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { t as tGlobal } from '@/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import { useBookmarkStore } from '@/stores/bookmark'
import { useCategoryStore } from '@/stores/category'
import { storageService } from '@/services/storage'
import { supabaseService } from '@/services/supabase'
import type { Settings } from '@/types'

const i18n = useI18n()
const t = tGlobal
const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const dialogVisible = ref(props.modelValue)
const formData = ref<Settings>({ ...settingsStore.settings })

const historyVisible = ref(false)
const backupHistory = ref<any[]>([])
const loadingHistory = ref(false)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    formData.value = { ...settingsStore.settings }
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  await settingsStore.updateSettings(formData.value)
  ElMessage.success(t('settings.saveSuccess'))
  handleClose()
}

const handleManualBackup = async () => {
  try {
    await storageService.performAutoBackup()
    await settingsStore.loadSettings()
    ElMessage.success(t('settings.backupSuccess'))
  } catch (error) {
    ElMessage.error(t('common.operationFailed', { error }))
  }
}

const handleRestoreBackup = async () => {
  try {
    await ElMessageBox.confirm(
      t('settings.restoreConfirm'),
      t('common.warning'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    
    await storageService.restoreFromAutoBackup()
    
    // Reload all stores
    const bookmarkStore = useBookmarkStore()
    const categoryStore = useCategoryStore()
    await bookmarkStore.loadBookmarks()
    await categoryStore.loadCategories()
    await settingsStore.loadSettings()
    
    ElMessage.success(t('settings.restoreSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(t('common.operationFailed', { error: error.message || error }))
    }
  }
}

const handleTestSupabase = async () => {
  try {
    const success = await supabaseService.testConnection(formData.value)
    if (success) {
      ElMessage.success(t('settings.supabase.testSuccess'))
    }
  } catch (error: any) {
    ElMessage.error(t('settings.supabase.testFailed') + ': ' + (error.message || error))
  }
}

const handleSyncCloud = async () => {
  try {
    await storageService.syncToCloud()
    await settingsStore.loadSettings()
    ElMessage.success(t('settings.supabase.syncSuccess'))
  } catch (error: any) {
    ElMessage.error(t('common.operationFailed', { error: error.message || error }))
  }
}

const handleRestoreCloud = async () => {
  try {
    historyVisible.value = true
    loadingHistory.value = true
    backupHistory.value = await supabaseService.getRecentBackups(formData.value)
  } catch (error: any) {
    ElMessage.error(t('common.operationFailed', { error: error.message || error }))
    historyVisible.value = false
  } finally {
    loadingHistory.value = false
  }
}

const handleSelectRestore = async (data: any) => {
  try {
    await ElMessageBox.confirm(
      t('settings.restoreConfirm'),
      t('common.warning'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )
    
    await storageService.restoreFromCloud(data)
    
    // Reload all stores
    const bookmarkStore = useBookmarkStore()
    const categoryStore = useCategoryStore()
    await bookmarkStore.loadBookmarks()
    await categoryStore.loadCategories()
    await settingsStore.loadSettings()
    
    historyVisible.value = false
    ElMessage.success(t('settings.restoreSuccess'))
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(t('common.operationFailed', { error: error.message || error }))
    }
  }
}

const handleCopySql = () => {
  const sql = supabaseService.generateInitialSql(formData.value.supabaseTable || 'bookmarks_backup')
  navigator.clipboard.writeText(sql).then(() => {
    ElMessage.success(t('settings.supabase.copySqlSuccess'))
  }).catch(err => {
    ElMessage.error(t('common.operationFailed', { error: err }))
  })
}
</script>

<style scoped>
.backup-container {
  max-height: calc(90vh - 160px);
  overflow-y: auto;
  padding-right: 4px;
}

.backup-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.timestamp {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.backup-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  width: 100%;
}

.empty-history {
  padding: 40px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
