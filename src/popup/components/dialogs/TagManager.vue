<template>
  <el-dialog
    :model-value="modelValue"
    :title="t('tag.manager')"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="tag-manager">
      <!-- 标签输入 -->
      <div class="add-tag">
        <el-input
          v-model="newTagName"
          :placeholder="t('tag.addPlaceholder')"
          clearable
          @keyup.enter="handleAddTag"
        >
          <template #append>
            <el-button :icon="Plus" @click="handleAddTag">{{ t('tag.add') }}</el-button>
          </template>
        </el-input>
      </div>

      <!-- 标签列表 -->
      <div class="tag-list">
        <el-empty v-if="tags.length === 0" :description="t('tag.noTags')" />
        <div v-else class="tag-grid">
          <div
            v-for="tag in tags"
            :key="tag.id"
            class="tag-item"
            :style="{ borderColor: tag.color }"
          >
            <div class="tag-info">
              <el-tag
                :color="tag.color"
                :style="{ backgroundColor: tag.color }"
                effect="dark"
              >
                {{ tag.name }}
              </el-tag>
              <span class="tag-count">{{ t('tag.bookmarkCount', { count: tag.count }) }}</span>
            </div>
            <div class="tag-actions">
              <el-button
                :icon="Delete"
                size="small"
                text
                type="danger"
                @click="handleDeleteTag(tag.id, tag.name)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">{{ t('tag.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { t as tGlobal } from '@/i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { Tag } from '@/types'
import { storageService } from '@/services/storage'

const i18n = useI18n()
const t = tGlobal

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tags = ref<Tag[]>([])
const newTagName = ref('')

const tagColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe'
]

const getRandomColor = () => {
  return tagColors[Math.floor(Math.random() * tagColors.length)]
}

const loadTags = async () => {
  const allTags = await storageService.getTags()
  const bookmarks = await storageService.getBookmarks()

  tags.value = allTags.map(tag => ({
    ...tag,
    count: bookmarks.filter(b => b.tags?.includes(tag.name)).length
  }))

  tags.value.sort((a, b) => b.count - a.count)
}

const handleAddTag = async () => {
  const name = newTagName.value.trim()
  if (!name) {
    ElMessage.warning(t('tag.nameRequired'))
    return
  }

  if (tags.value.some(t => t.name === name)) {
    ElMessage.warning(t('tag.alreadyExists'))
    return
  }

  try {
    await storageService.addTag({
      name,
      color: getRandomColor(),
      count: 0
    })
    
    ElMessage.success(t('tag.addSuccess'))
    newTagName.value = ''
    await loadTags()
  } catch (error) {
    ElMessage.error(t('tag.addFailed', { error }))
  }
}

const handleDeleteTag = async (id: string, name: string) => {
  try {
    await ElMessageBox.confirm(
      t('tag.deleteConfirm', { name }),
      t('tag.warning'),
      {
        confirmButtonText: t('tag.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      }
    )

    await storageService.deleteTag(id)
    ElMessage.success(t('tag.deleteSuccess'))
    await loadTags()
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  loadTags()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    loadTags()
  }
})
</script>

<style scoped>
.tag-manager {
  min-height: 300px;
}

.add-tag {
  margin-bottom: 20px;
}

.tag-list {
  max-height: 400px;
  overflow-y: auto;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.tag-item {
  padding: 12px;
  border: 2px solid;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s;
}

.tag-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.tag-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.tag-actions {
  display: flex;
  gap: 4px;
}
</style>
