<template>
  <el-dialog
    :model-value="modelValue"
    title="书签详情"
    width="500px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="bookmark" class="bookmark-detail">
      <div class="detail-header">
        <img
          v-if="bookmark.favicon"
          :src="bookmark.favicon"
          class="favicon"
          @error="handleFaviconError"
        />
        <el-icon v-else class="favicon-placeholder"><Link /></el-icon>
        <div class="title">{{ bookmark.title }}</div>
      </div>

      <div class="detail-item">
        <label>网址</label>
        <div class="value">
          <a :href="bookmark.url" target="_blank" @click.prevent="handleOpen">{{ bookmark.url }}</a>
        </div>
      </div>

      <div class="detail-item" v-if="bookmark.description">
        <label>描述</label>
        <div class="value">{{ bookmark.description }}</div>
      </div>

      <div class="detail-item" v-if="bookmark.tags && bookmark.tags.length > 0">
        <label>标签</label>
        <div class="tags">
          <el-tag
            v-for="tag in bookmark.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <div class="detail-row">
        <div class="detail-item">
          <label>创建时间</label>
          <div class="value">{{ formatDate(bookmark.createdAt) }}</div>
        </div>
        <div class="detail-item">
          <label>访问次数</label>
          <div class="value">{{ bookmark.visitCount || 0 }} 次</div>
        </div>
      </div>
      
      <div class="detail-item">
        <label>最后访问</label>
        <div class="value">{{ bookmark.lastVisit ? formatDate(bookmark.lastVisit) : '从未访问' }}</div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="left-actions">
           <el-button type="danger" text :icon="Delete" @click="handleDelete">删除</el-button>
        </div>
        <div class="right-actions">
           <el-button :icon="Edit" @click="$emit('edit', bookmark?.id)">编辑</el-button>
           <el-button type="primary" @click="handleOpen">打开</el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Link, Edit, Delete } from '@element-plus/icons-vue'
import type { Bookmark } from '@/types'
import { format } from 'date-fns'

interface Props {
  modelValue: boolean
  bookmark?: Bookmark | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
  (e: 'open', id: string): void
}>()

const handleFaviconError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none'
}

const formatDate = (timestamp: number) => {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
}

const handleOpen = () => {
  if (props.bookmark) {
    emit('open', props.bookmark.id)
    window.open(props.bookmark.url, '_blank')
    emit('update:modelValue', false)
  }
}

const handleDelete = () => {
    if (props.bookmark) {
        emit('delete', props.bookmark.id)
        emit('update:modelValue', false)
    }
}
</script>

<style scoped>
.bookmark-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.favicon,
.favicon-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.favicon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 24px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  gap: 24px;
}

.detail-item label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.value {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.right-actions {
    display: flex;
    gap: 8px;
}
</style>
