<template>
  <el-dialog
    v-model="dialogVisible"
    title="设置"
    width="500px"
    @close="handleClose"
  >
    <el-form :model="formData" label-width="120px">
      <el-form-item label="主题">
        <el-radio-group v-model="formData.theme">
          <el-radio label="light">浅色</el-radio>
          <el-radio label="dark">深色</el-radio>
          <el-radio label="auto">跟随系统</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="默认视图">
        <el-radio-group v-model="formData.defaultView">
          <el-radio label="list">列表</el-radio>
          <el-radio label="grid">网格</el-radio>
          <el-radio label="card">卡片</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="排序方式">
        <el-select v-model="formData.sortBy">
          <el-option label="创建时间" value="time" />
          <el-option label="最后访问" value="lastVisit" />
          <el-option label="名称" value="name" />
          <el-option label="访问次数" value="visit" />
        </el-select>
      </el-form-item>

      <el-form-item label="显示网站图标">
        <el-switch v-model="formData.showFavicon" />
      </el-form-item>

      <el-form-item label="显示备注">
        <el-switch v-model="formData.showDescription" />
      </el-form-item>

      <el-form-item label="启用快捷键">
        <el-switch v-model="formData.enableShortcuts" />
      </el-form-item>

      <el-form-item label="自动备份">
        <el-switch v-model="formData.autoBackup" />
      </el-form-item>

      <el-form-item v-if="formData.autoBackup" label="备份间隔">
        <el-input-number
          v-model="formData.backupInterval"
          :min="1"
          :max="30"
        />
        <span style="margin-left: 8px;">天</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import type { Settings } from '@/types'

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
  ElMessage.success('设置已保存')
  handleClose()
}
</script>
