<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="80px"
    status-icon
    class="bookmark-form"
  >
    <el-form-item :label="t('bookmark.title')" prop="title">
      <el-input v-model="form.title" :placeholder="t('bookmark.titlePlaceholder')" />
    </el-form-item>

    <el-form-item :label="t('bookmark.url')" prop="url">
      <el-input v-model="form.url" :placeholder="t('bookmark.urlPlaceholder')" />
    </el-form-item>

    <el-form-item :label="t('bookmark.category')" prop="categoryId">
      <el-tree-select
        v-model="form.categoryId"
        :data="treeData"
        :props="{ label: 'name', value: 'id', children: 'children' }"
        check-strictly
        :placeholder="t('bookmark.categoryPlaceholder')"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item :label="t('bookmark.tags')" prop="tags">
      <el-select
        v-model="form.tags"
        multiple
        filterable
        :placeholder="t('bookmark.tagsPlaceholder')"
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

    <el-form-item :label="t('bookmark.description')" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="2"
        :placeholder="t('bookmark.descriptionPlaceholder')"
      />
    </el-form-item>

    <div class="form-actions" v-if="showFooter">
      <el-button @click="$emit('cancel')">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">
        {{ t('common.confirm') }}
      </el-button>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { storageService } from '@/services/storage'
import type { Bookmark, Category } from '@/types'

const { t } = useI18n()

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

const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t('bookmark.titleRequired'), trigger: 'blur' }],
  url: [
    { required: true, message: t('bookmark.urlRequired'), trigger: 'blur' },
    { type: 'url', message: t('bookmark.urlInvalid'), trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: t('bookmark.categoryRequired'), trigger: 'change' }]
}))

const treeData = computed(() => {
  const map = new Map<string, any>()
  const roots: any[] = []

  props.categories.forEach(c => {
    map.set(c.id, { 
      ...c, 
      name: c.id === 'default' ? t('category.default') : c.name,
      children: [] 
    })
  })

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
