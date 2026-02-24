<template>
  <div class="category-tree">
    <div class="category-item all-bookmarks" :class="{ active: selectedId === null }" @click="$emit('select', null)">
      <div class="collapse-spacer"></div>
      <el-icon><FolderOpened /></el-icon>
      <span>{{ t('app.allBookmarks') }}</span>
    </div>
    
    <div class="tree-content">
      <draggable
        v-model="dragList"
        item-key="id"
        @end="handleDragEnd"
        ghost-class="ghost"
      >
        <template #item="{ element }">
          <CategoryTreeNode
            :category="element"
            :all-categories="categories"
            :selected-id="selectedId"
            @select="$emit('select', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpened } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types'
import CategoryTreeNode from './CategoryTreeNode.vue'

interface Props {
  categories: Category[]
  selectedId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits(['select', 'add', 'edit', 'delete'])

const { t } = useI18n()

const categoryStore = useCategoryStore()
const dragList = ref<Category[]>([])

const rootCategories = computed(() => {
  return props.categories
    .filter(c => c.parentId === null)
    .sort((a, b) => a.order - b.order)
})

watch(rootCategories, (newVal) => {
  dragList.value = [...newVal]
}, { immediate: true })

const handleDragEnd = async () => {
  // Update order for all items based on new index
  const updates = dragList.value.map((category, index) => ({
    id: category.id,
    order: index
  }))
  
  // Update store
  for (const update of updates) {
    const originalRoot = rootCategories.value.find(c => c.id === update.id)
    if (originalRoot && update.order !== originalRoot.order) {
       await categoryStore.updateCategory(update.id, { order: update.order })
    }
  }
}
</script>

<style scoped>
.category-tree {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.category-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}

.collapse-spacer {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.category-item:hover {
  background: var(--bg-hover);
}

.category-item.active {
  background: var(--color-primary);
  color: white;
}

.all-bookmarks {
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
}

.tree-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ghost {
  opacity: 0.5;
  background: var(--bg-hover);
}
</style>
