<template>
  <div 
    class="bookmark-list"
    v-infinite-scroll="loadMore"
    :infinite-scroll-distance="100"
    :infinite-scroll-immediate="true"
  >
    <el-empty v-if="bookmarks.length === 0" description="暂无书签" />
    
    <div v-else :class="['list-container', `view-${viewMode}`]">
      <div
        v-for="bookmark in displayedBookmarks"
        :key="bookmark.id"
        class="bookmark-item"
        @click="$emit('click', bookmark)"
      >
        <div class="bookmark-main">
          <img
            v-if="bookmark.favicon"
            :src="bookmark.favicon"
            class="favicon"
            @error="handleFaviconError"
          />
          <el-icon v-else class="favicon-placeholder"><Link /></el-icon>
          
          <div class="bookmark-info">
            <div class="bookmark-title">{{ bookmark.title }}</div>
            <!-- URL only visible in List and Card view -->
            <div v-if="viewMode !== 'grid'" class="bookmark-url">{{ bookmark.url }}</div>
            <!-- Description only visible in Card view -->
            <div v-if="viewMode === 'card' && bookmark.description" class="bookmark-description">
              {{ bookmark.description }}
            </div>
            <!-- Tags only visible in Card view -->
            <div v-if="viewMode === 'card' && bookmark.tags?.length" class="bookmark-tags">
              <el-tag v-for="tag in bookmark.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
        
        <div class="bookmark-actions">
          <el-tooltip content="编辑">
            <el-button :icon="Edit" size="small" circle @click.stop="$emit('edit', bookmark.id)" />
          </el-tooltip>
          <el-tooltip content="删除">
            <el-button :icon="Delete" size="small" circle @click.stop="$emit('delete', bookmark.id)" />
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- Loading indicator when more data is being loaded -->
    <div v-if="hasMore" class="loading-more">
      <el-icon class="is-loading"><Loading /></el-icon>
      正在加载更多...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Link, Edit, Delete, Loading } from '@element-plus/icons-vue'
import type { Bookmark } from '@/types'

interface Props {
  bookmarks: Bookmark[]
  viewMode?: 'list' | 'grid' | 'card'
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'list'
})

defineEmits(['click', 'edit', 'delete'])

const pageSize = 40
const displayCount = ref(pageSize)

const displayedBookmarks = computed(() => {
  return props.bookmarks.slice(0, displayCount.value)
})

const hasMore = computed(() => {
  return displayCount.value < props.bookmarks.length
})

const loadMore = () => {
  if (hasMore.value) {
    displayCount.value += pageSize
  }
}

// Reset scroll count when bookmarks list changes (e.g., after search or category change)
watch(() => props.bookmarks, () => {
  displayCount.value = pageSize
}, { deep: false })

const handleFaviconError = (e: Event) => {
  (e.target as HTMLImageElement).style.display = 'none'
}
</script>

<style scoped>
.bookmark-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

/* Grid View Layout */
.list-container.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-md);
}

/* Card View Layout */
.list-container.view-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.bookmark-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

/* Grid View Item Styles */
.view-grid .bookmark-item {
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-lg) var(--spacing-sm);
  height: 100%;
}

.view-grid .bookmark-main {
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
}

.view-grid .bookmark-info {
  width: 100%;
}

.view-grid .favicon, 
.view-grid .favicon-placeholder {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
}

/* Card View Item Styles */
.view-card .bookmark-item {
  align-items: flex-start;
  height: 100%;
}

.view-card .bookmark-main {
  flex-direction: column;
  gap: var(--spacing-sm);
}

.view-card .favicon, 
.view-card .favicon-placeholder {
  width: 32px;
  height: 32px;
}

/* General Styles */
.bookmark-item:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.bookmark-item:hover .bookmark-actions {
  opacity: 1;
}

.bookmark-main {
  flex: 1;
  display: flex;
  gap: var(--spacing-md);
  min-width: 0;
}

.favicon,
.favicon-placeholder {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.favicon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-url {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-description {
  font-size: 12px;
  color: var(--text-regular);
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.bookmark-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: 8px;
  flex-wrap: wrap;
}

.bookmark-actions {
  display: flex;
  gap: var(--spacing-xs);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

/* Actions positioning for Grid and Card views */
.view-grid .bookmark-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 2px;
}

.view-card .bookmark-actions {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
