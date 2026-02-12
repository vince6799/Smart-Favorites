<template>
  <el-dialog
    :model-value="modelValue"
    title="标签管理"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="tag-manager">
      <!-- 标签输入 -->
      <div class="add-tag">
        <el-input
          v-model="newTagName"
          placeholder="添加新标签"
          clearable
          @keyup.enter="handleAddTag"
        >
          <template #append>
            <el-button :icon="Plus" @click="handleAddTag">添加</el-button>
          </template>
        </el-input>
      </div>

      <!-- 标签列表 -->
      <div class="tag-list">
        <el-empty v-if="tags.length === 0" description="暂无标签" />
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
              <span class="tag-count">{{ tag.count }} 个书签</span>
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
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import type { Tag } from '@/types'
import { storageService } from '@/services/storage'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const tags = ref<Tag[]>([])
const newTagName = ref('')

// 颜色预设
const tagColors = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#ff6b6b', '#4ecdc4', '#45b7d1',
  '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe'
]

// 随机颜色
const getRandomColor = () => {
  return tagColors[Math.floor(Math.random() * tagColors.length)]
}

// 加载标签
const loadTags = async () => {
  const allTags = await storageService.getTags()
  const bookmarks = await storageService.getBookmarks()

  // 计算每个标签的使用次数
  tags.value = allTags.map(tag => ({
    ...tag,
    count: bookmarks.filter(b => b.tags?.includes(tag.name)).length
  }))

  // 按使用次数排序
  tags.value.sort((a, b) => b.count - a.count)
}

// 添加标签
const handleAddTag = async () => {
  const name = newTagName.value.trim()
  if (!name) {
    ElMessage.warning('请输入标签名称')
    return
  }

  // 检查是否已存在
  if (tags.value.some(t => t.name === name)) {
    ElMessage.warning('标签已存在')
    return
  }

  try {
    await storageService.addTag({
      name,
      color: getRandomColor(),
      count: 0
    })
    
    ElMessage.success('标签添加成功')
    newTagName.value = ''
    await loadTags()
  } catch (error) {
    ElMessage.error('添加失败：' + error)
  }
}

// 删除标签
const handleDeleteTag = async (id: string, name: string) => {
  try {
    await ElMessageBox.confirm(
      `删除标签 "${name}" 将从所有书签中移除该标签，是否继续？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await storageService.deleteTag(id)
    ElMessage.success('标签删除成功')
    await loadTags()
  } catch (error) {
    // 用户取消
  }
}

// 初始化
onMounted(() => {
  loadTags()
})

// 监听打开动作，确保数据实时刷新
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
