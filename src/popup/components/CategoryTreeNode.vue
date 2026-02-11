<template>
  <div class="tree-node">
    <div
      class="node-content"
      :class="{ active: selectedId === category.id }"
      :style="{ paddingLeft: `${level * 16 + 12}px` }"
      @click="handleSelect"
      @contextmenu.prevent="showContextMenu"
    >
      <el-icon
        v-if="hasChildren"
        class="collapse-icon"
        :class="{ expanded: !category.collapsed }"
        @click.stop="toggleCollapse"
      >
        <CaretRight />
      </el-icon>
      <div v-else class="collapse-spacer"></div>
      <span class="icon">{{ category.icon }}</span>
      <span class="name">{{ category.name }}</span>
      
      <el-dropdown 
        v-if="category.id !== 'default'"
        trigger="click" 
        @command="handleCommand" 
        class="actions"
      >
        <span class="el-dropdown-link" @click.stop>
          <el-icon><MoreFilled /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
            <el-dropdown-item command="delete" :icon="Delete" type="danger">删除</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div v-if="hasChildren && !category.collapsed" class="children">
      <draggable
        v-model="dragChildren"
        item-key="id"
        @end="handleDragEnd"
        ghost-class="ghost"
      >
        <template #item="{ element }">
          <CategoryTreeNode
            :category="element"
            :all-categories="allCategories"
            :selected-id="selectedId"
            :level="level + 1"
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
import { CaretRight, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import draggable from 'vuedraggable'
import { useCategoryStore } from '@/stores/category'
import type { Category } from '@/types'

interface Props {
  category: Category
  allCategories: Category[]
  selectedId: string | null
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

const emit = defineEmits(['select', 'edit', 'delete'])

const categoryStore = useCategoryStore()
const dragChildren = ref<Category[]>([])

const children = computed(() => {
  return props.allCategories
    .filter(c => c.parentId === props.category.id)
    .sort((a, b) => a.order - b.order)
})

const hasChildren = computed(() => children.value.length > 0)

watch(children, (newVal) => {
  dragChildren.value = [...newVal]
}, { immediate: true })

const handleSelect = async () => {
  emit('select', props.category.id)
  if (hasChildren.value && props.category.collapsed) {
    await toggleCollapse()
  }
}

const handleCommand = (command: string) => {
  if (command === 'edit') {
    emit('edit', props.category.id)
  } else if (command === 'delete') {
    emit('delete', props.category.id)
  }
}

const handleDragEnd = async () => {
    const updates = dragChildren.value.map((child, index) => ({
        id: child.id,
        order: index
    }))

    for (const update of updates) {
        const originalChild = children.value.find(c => c.id === update.id)
        if (originalChild && update.order !== originalChild.order) {
            await categoryStore.updateCategory(update.id, { order: update.order })
        }
    }
}

const toggleCollapse = async () => {
  await categoryStore.updateCategory(props.category.id, { 
    collapsed: !props.category.collapsed 
  })
}

const showContextMenu = () => {
  // TODO: 显示右键菜单
}
</script>

<style scoped>
.tree-node {
  width: 100%;
}

.node-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 6px var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  position: relative;
}

.node-content:hover {
  background: var(--bg-hover);
}

.node-content.active {
  background: var(--color-primary);
  color: white;
}

.actions {
  display: none;
  margin-left: auto;
  padding: 2px;
  border-radius: 4px;
}

.node-content:hover .actions {
  display: block;
}

.actions:hover {
  background: rgba(0, 0, 0, 0.1);
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  color: inherit;
}

.node-content.active .el-dropdown-link {
  color: white;
}

.collapse-icon,
.collapse-spacer {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collapse-icon {
  font-size: 12px;
  transition: transform var(--transition-fast);
  cursor: pointer;
}

/* Default state: pointing right (collapsed) */
.collapse-icon {
  transform: rotate(0deg);
}

/* Expanded state: pointing down (rotate 90deg) */
.collapse-icon.expanded {
  transform: rotate(90deg);
}

.icon {
  font-size: 16px;
}

.name {
  flex: 1;
  font-size: 14px;
}

.children {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ghost {
  opacity: 0.5;
  background: var(--bg-hover);
}
</style>
