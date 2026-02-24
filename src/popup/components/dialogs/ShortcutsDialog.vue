<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('settings.shortcuts.title')"
    width="460px"
    @close="handleClose"
  >
    <div class="shortcuts-container">
      <el-form label-width="140px">
        <el-form-item :label="t('settings.enableShortcuts')">
          <el-switch v-model="formData.enableShortcuts" @change="handleSave" />
        </el-form-item>
      </el-form>

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
        
        <div class="shortcut-actions">
          <el-button type="primary" link @click="openShortcutSettings">
            {{ t('settings.shortcuts.customize') }}
            <el-icon class="el-icon--right"><ArrowRight /></el-icon>
          </el-button>
          <div class="shortcut-tip">
            {{ t('settings.shortcuts.shortcutTip') }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('common.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const props = defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const dialogVisible = ref(props.modelValue)
const formData = ref({
  enableShortcuts: settingsStore.settings.enableShortcuts
})

const commands = ref<chrome.commands.Command[]>([])

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    formData.value.enableShortcuts = settingsStore.settings.enableShortcuts
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

onMounted(async () => {
  if (chrome.commands) {
    commands.value = await chrome.commands.getAll()
  }
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  await settingsStore.updateSettings({
    enableShortcuts: formData.value.enableShortcuts
  })
}

const openShortcutSettings = () => {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
}
</script>

<style scoped>
.shortcuts-container {
  padding: 10px 0;
}

.shortcuts-list {
  margin-top: 20px;
  padding: 0 20px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item .label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.shortcut-actions {
  margin-top: 20px;
  text-align: right;
}

.shortcut-tip {
  margin-top: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}
</style>
