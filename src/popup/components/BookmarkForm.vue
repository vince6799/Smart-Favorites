<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
    status-icon
    class="bookmark-form"
  >
    <el-form-item label="标题" prop="title">
      <el-input v-model="form.title" placeholder="请输入书签标题" />
    </el-form-item>

    <el-form-item label="网址" prop="url">
      <el-input v-model="form.url" placeholder="https://example.com" />
    </el-form-item>

    <el-form-item label="分类" prop="categoryId">
      <el-tree-select
        v-model="form.categoryId"
        :data="treeData"
        :props="{ label: 'name', value: 'id', children: 'children' }"
        check-strictly
        placeholder="请选择分类"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item label="标签" prop="tags">
      <el-select
        v-model="form.tags"
        multiple
        filterable
        placeholder="请选择标签"
        style="width: 100%"
      >
        <el-option
          v-for="item in availableTags"
          :key="item"
          :label="item"
          :value="item"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="2"
        placeholder="请输入描述（可选）"
      />
    </el-form-item>

    <div class="form-actions" v-if="showFooter">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">
        确定
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { storageService } from '@/services/storage'
import type { Bookmark, Category } from '@/types'

const props = withDefaults(defineProps<{
  initialData?: Partial<Bookmark>
  categories: Category[]
  loading?: boolean
  showFooter?: boolean
}>(), {
  initialData: () => ({}),
  loading: false,
  showFooter: true
})

const emit = defineEmits<{
  (e: 'submit', data: Partial<Bookmark>): void
  (e: 'cancel'): void
}>()

const formRef = ref<FormInstance>()
const availableTags = ref<string[]>([])

const form = reactive({
  title: '',
  url: '',
  categoryId: '',
  tags: [] as string[],
  description: ''
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的网址格式', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const treeData = computed(() => {
  const map = new Map<string, any>()
  const roots: any[] = []

  // Create nodes
  props.categories.forEach(c => {
    map.set(c.id, { ...c, children: [] })
  })

  // Build tree
  props.categories.forEach(c => {
    const node = map.get(c.id)
    if (c.parentId !== null && c.parentId !== undefined && c.parentId !== '' && map.has(c.parentId)) {
      map.get(c.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
})

const loadTags = async () => {
    const tags = await storageService.getTags()
    availableTags.value = tags.map(t => t.name)
}

const initForm = () => {
  form.title = props.initialData?.title || ''
  form.url = props.initialData?.url || ''
  form.categoryId = props.initialData?.categoryId || (props.categories.length > 0 ? props.categories[0].id : '')
  form.tags = props.initialData?.tags ? [...props.initialData.tags] : []
  form.description = props.initialData?.description || ''
}

onMounted(() => {
  initForm()
  loadTags()
})

watch(() => props.initialData, () => {
  initForm()
}, { deep: true })

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('submit', { ...form })
    }
  })
}

defineExpose({
  submit: handleSave
})
</script>

<style scoped>
.bookmark-form {
  padding: 5px 0;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
}
</style>
