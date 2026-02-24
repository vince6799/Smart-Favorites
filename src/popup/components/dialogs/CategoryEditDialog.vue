<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? t('category.edit') : t('category.new')"
    width="450px"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item :label="t('category.name')" prop="name">
        <el-input
          v-model="formData.name"
          :placeholder="t('category.nameRequired')"
          clearable
        />
      </el-form-item>

      <el-form-item :label="t('category.parent')">
        <el-cascader
          v-model="selectedParentPath"
          :options="categoryOptions"
          :props="cascaderProps"
          :placeholder="t('category.noParent')"
          clearable
          style="width: 100%"
          @change="handleParentChange"
        />
      </el-form-item>

      <el-form-item :label="t('category.icon')">
        <div class="icon-selector">
          <div
            v-for="emoji in emojiList"
            :key="emoji"
            class="emoji-item"
            :class="{ selected: formData.icon === emoji }"
            @click="formData.icon = emoji"
          >
            {{ emoji }}
          </div>
        </div>
      </el-form-item>

      <el-form-item :label="t('category.color')">
        <div class="color-selector">
          <div
            v-for="color in colorList"
            :key="color"
            class="color-item"
            :class="{ selected: formData.color === color }"
            :style="{ backgroundColor: color }"
            @click="formData.color = color"
          />
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">{{ t('category.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ isEdit ? t('category.save') : t('category.create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { Category } from '@/types'
import { useCategoryStore } from '@/stores/category'

const { t } = useI18n()

interface Props {
  modelValue: boolean
  category?: Category
  defaultParentId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: Partial<Category>): void
}

const props = withDefaults(defineProps<Props>(), {
  category: undefined,
  defaultParentId: null
})

const emit = defineEmits<Emits>()

const categoryStore = useCategoryStore()
const { categories } = storeToRefs(categoryStore)

const formRef = ref<FormInstance>()
const formData = ref({
  name: '',
  parentId: null as string | null,
  icon: '📁',
  color: '#409EFF'
})

const selectedParentPath = ref<string[]>([])

const emojiList = [
  '📁', '📂', '📚', '📖', '📝', '📰', '🗂️', '📋',
  '💼', '🎯', '🎨', '🎮', '🎵', '🎬', '📷', '🏠',
  '💻', '🔧', '🔨', '⚙️', '🌟', '⭐', '❤️', '🔥'
]

const colorList = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#a29bfe', '#fd79a8'
]

const isEdit = computed(() => !!props.category)

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false
}

const categoryOptions = computed(() => {
  const excludeIds = new Set<string>()
  
  if (isEdit.value && props.category) {
    const addDescendants = (id: string) => {
      excludeIds.add(id)
      categories.value
        .filter(c => c.parentId === id)
        .forEach(c => addDescendants(c.id))
    }
    addDescendants(props.category.id)
  }

  const buildTree = (parentId: string | null = null): any[] => {
    return categories.value
      .filter(c => c.parentId === parentId && !excludeIds.has(c.id))
      .sort((a, b) => a.order - b.order)
      .map(c => ({
        id: c.id,
        name: c.id === 'default' ? t('category.default') : c.name,
        children: buildTree(c.id)
      }))
  }
  return buildTree()
})

const rules = computed<FormRules>(() => ({
  name: [
    { required: true, message: t('category.nameRequired'), trigger: 'blur' }
  ]
}))

const handleParentChange = (value: string) => {
  formData.value.parentId = value || null
}

const initFormData = () => {
  if (props.category) {
    formData.value = {
      name: props.category.name,
      parentId: props.category.parentId,
      icon: props.category.icon,
      color: props.category.color
    }
    selectedParentPath.value = props.category.parentId ? [props.category.parentId] : []
  } else {
    formData.value = {
      name: '',
      parentId: props.defaultParentId,
      icon: '📁',
      color: '#409EFF'
    }
    selectedParentPath.value = props.defaultParentId ? [props.defaultParentId] : []
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      const submitData: Partial<Category> = {
        ...formData.value
      }
      
      if (isEdit.value && props.category) {
        submitData.id = props.category.id
      }

      emit('submit', submitData)
      handleClose()
    } else {
      ElMessage.warning(t('category.formIncomplete'))
    }
  })
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initFormData()
  }
})
</script>

<style scoped>
.icon-selector {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
}

.emoji-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  transition: all 0.2s;
}

.emoji-item:hover {
  background-color: var(--bg-hover);
}

.emoji-item.selected {
  border-color: var(--color-primary);
  background-color: var(--bg-hover);
}

.color-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-item {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
}

.color-item.selected {
  border-color: #333;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
}
</style>
