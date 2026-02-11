<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑分类' : '新建分类'"
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
      <el-form-item label="分类名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入分类名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="父分类">
        <el-cascader
          v-model="selectedParentPath"
          :options="categoryOptions"
          :props="cascaderProps"
          placeholder="无（作为根分类）"
          clearable
          style="width: 100%"
          @change="handleParentChange"
        />
      </el-form-item>

      <el-form-item label="图标">
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

      <el-form-item label="颜色">
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
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">
        {{ isEdit ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { Category } from '@/types'
import { useCategoryStore } from '@/stores/category'

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

// 图标列表
const emojiList = [
  '📁', '📂', '📚', '📖', '📝', '📰', '🗂️', '📋',
  '💼', '🎯', '🎨', '🎮', '🎵', '🎬', '📷', '🏠',
  '💻', '🔧', '🔨', '⚙️', '🌟', '⭐', '❤️', '🔥'
]

// 颜色列表
const colorList = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#a29bfe', '#fd79a8'
]

// 是否为编辑模式
const isEdit = computed(() => !!props.category)

// 分类级联选择器配置
const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false
}

// 构建分类树（排除当前分类及其子分类）
const categoryOptions = computed(() => {
  const excludeIds = new Set<string>()
  
  // 如果是编辑模式，需要排除当前分类及其子分类
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
        name: c.name,
        children: buildTree(c.id)
      }))
  }
  return buildTree()
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ]
}

// 父分类变更处理
const handleParentChange = (value: string) => {
  formData.value.parentId = value || null
}

// 初始化表单数据
const initFormData = () => {
  if (props.category) {
    // 编辑模式
    formData.value = {
      name: props.category.name,
      parentId: props.category.parentId,
      icon: props.category.icon,
      color: props.category.color
    }
    selectedParentPath.value = props.category.parentId ? [props.category.parentId] : []
  } else {
    // 新建模式
    formData.value = {
      name: '',
      parentId: props.defaultParentId,
      icon: '📁',
      color: '#409EFF'
    }
    selectedParentPath.value = props.defaultParentId ? [props.defaultParentId] : []
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}

// 提交表单
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
      ElMessage.warning('请完善表单信息')
    }
  })
}

// 监听对话框打开
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
