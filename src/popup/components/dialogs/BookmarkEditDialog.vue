<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑书签' : '添加书签'"
    width="500px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <BookmarkForm
      :initial-data="bookmark"
      :categories="categories"
      :loading="saving"
      @submit="handleSave"
      @cancel="visible = false"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Bookmark, Category } from '@/types'
import BookmarkForm from '../BookmarkForm.vue'

const props = defineProps<{
  modelValue: boolean
  bookmark?: Bookmark | undefined
  categories: Category[]
  initialCategoryId?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', bookmark: Partial<Bookmark>): void
}>()

const saving = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.bookmark)

const handleSave = async (formData: Partial<Bookmark>) => {
  saving.value = true
  try {
    emit('submit', {
      ...formData,
      id: props.bookmark?.id,
      createdAt: props.bookmark?.createdAt || Date.now(),
      updatedAt: Date.now(),
      visitCount: props.bookmark?.visitCount || 0
    })
    visible.value = false
  } finally {
    saving.value = false
  }
}
</script>
