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

    </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ t('settings.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave">{{ t('settings.save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import type { Settings } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'open-shortcuts', 'open-backup'])

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
</script>
