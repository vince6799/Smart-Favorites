<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('settings.title')"
    width="500px"
    :style="{ maxHeight: '90vh' }"
    @close="handleClose"
  >
    <div style="max-height: calc(90vh - 160px); overflow-y: auto; padding-right: 4px;">
    <el-form :model="formData" label-width="140px">
      <el-form-item :label="t('settings.language')">
        <el-select v-model="formData.language">
          <el-option label="中文" value="zh" />
          <el-option label="English" value="en" />
          <el-option label="日本語" value="ja" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('settings.theme')">
        <el-radio-group v-model="formData.theme">
          <el-radio label="light">{{ t('settings.themeLight') }}</el-radio>
          <el-radio label="dark">{{ t('settings.themeDark') }}</el-radio>
          <el-radio label="auto">{{ t('settings.themeAuto') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="t('settings.defaultView')">
        <el-radio-group v-model="formData.defaultView">
          <el-radio label="list">{{ t('settings.viewList') }}</el-radio>
          <el-radio label="grid">{{ t('settings.viewGrid') }}</el-radio>
          <el-radio label="card">{{ t('settings.viewCard') }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item :label="t('settings.sortBy')">
        <el-select v-model="formData.sortBy">
          <el-option :label="t('sort.time')" value="time" />
          <el-option :label="t('sort.lastVisit')" value="lastVisit" />
          <el-option :label="t('sort.name')" value="name" />
          <el-option :label="t('sort.visit')" value="visit" />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('settings.showFavicon')">
        <el-switch v-model="formData.showFavicon" />
      </el-form-item>

      <el-form-item :label="t('settings.showDescription')">
        <el-switch v-model="formData.showDescription" />
      </el-form-item>

      <el-form-item :label="t('settings.enableShortcuts')">
        <el-switch v-model="formData.enableShortcuts" />
      </el-form-item>

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
        <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
          <span style="font-size: 13px; color: var(--el-text-color-secondary);">
            {{ settingsStore.settings.lastBackup ? new Date(settingsStore.settings.lastBackup).toLocaleString() : t('settings.neverBackup') }}
          </span>
          <div style="flex: 1;"></div>
          <el-button size="small" @click="handleManualBackup">{{ t('settings.backupNow') }}</el-button>
          <el-button size="small" type="danger" plain @click="handleRestoreBackup">{{ t('settings.restore') }}</el-button>
        </div>
      </el-form-item>

      <el-divider v-if="formData.enableShortcuts">{{ t('settings.shortcuts.title') }}</el-divider>
      
      <div v-if="formData.enableShortcuts" class="shortcuts-list">
        <div class="shortcut-item">
          <span class="label">{{ t('settings.shortcuts.openApp') }}</span>
          <el-tag size="small">{{ commands.find(c => c.name === '_execute_action')?.shortcut || 'Alt+Shift+M' }}</el-tag>
        </div>
        <div class="shortcut-item">
          <span class="label">{{ t('settings.shortcuts.quickSearch') }}</span>
          <el-tag size="small">{{ commands.find(c => c.name === 'quick_search')?.shortcut || 'Alt+Shift+S' }}</el-tag>
        </div>
        <div class="shortcut-item">
          <span class="label">{{ t('settings.shortcuts.inAppSearch') }}</span>
          <el-tag size="small">/</el-tag>
        </div>
        <div class="shortcut-item">
          <span class="label">{{ t('settings.shortcuts.newBookmark') }}</span>
          <el-tag size="small">N</el-tag>
        </div>
        <div style="margin-top: 12px; text-align: right;">
          <el-button type="primary" link @click="openShortcutSettings">
            {{ t('settings.shortcuts.customize') }}
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div style="margin-top: 4px; font-size: 11px; color: var(--el-text-color-secondary); text-align: right; line-height: 1.4;">
          {{ t('settings.shortcuts.shortcutTip') }}
        </div>
      </div>
    </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('settings.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ t('settings.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Refresh } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'
import { useBookmarkStore } from '@/stores/bookmark'
import { useCategoryStore } from '@/stores/category'
import { storageService } from '@/services/storage'
import type { Settings } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const dialogVisible = ref(props.modelValue)
const formData = ref<Settings>({ ...settingsStore.settings })

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
    
    // Reload all stores to reflect restored data
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

const commands = ref<chrome.commands.Command[]>([])

onMounted(async () => {
  if (chrome.commands) {
    commands.value = await chrome.commands.getAll()
  }
})

const openShortcutSettings = () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
}
</script>

<style scoped>
.shortcuts-list {
  padding: 0 20px 20px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item .label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>
