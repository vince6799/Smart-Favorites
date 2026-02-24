<template>
  <el-config-provider :locale="elLocale">
    <div class="app-container" :class="{ 'standalone-mode': isStandalone }" @contextmenu.prevent>
      <!-- Standalone Mode View -->
      <template v-if="isStandalone">
        <div class="standalone-card">
          <div class="standalone-header">
            <h3>{{ t('standalone.title') }}</h3>
            <el-button link @click="closeWindow">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
          <div class="standalone-body">
            <BookmarkForm
              :initial-data="standaloneForm"
              :categories="categories"
              :loading="bookmarkStore.loading"
              @submit="handleStandaloneSubmit"
              @cancel="closeWindow"
            />
          </div>
        </div>
      </template>

      <!-- Normal Mode View -->
      <template v-else>
        <!-- 顶部工具栏 -->
        <div class="header">
          <div class="header-left">
            <el-icon :size="20" color="var(--color-primary)"><Collection /></el-icon>
            <span class="title">{{ t('app.title') }}</span>
          </div>
          <div class="header-right">
            <el-input
              ref="searchInputRef"
              v-model="searchQuery"
              :placeholder="t('app.searchPlaceholder')"
              prefix-icon="Search"
              clearable
              class="search-input"
              @input="handleSearch"
            />
            <el-tooltip :content="t('app.tagManager')">
              <el-button :icon="PriceTag" circle @click="showTagManager = true" />
            </el-tooltip>
            <el-tooltip :content="t('app.settings')">
              <el-button :icon="Setting" circle @click="showSettings = true" />
            </el-tooltip>
          </div>
        </div>

        <!-- 主内容区域 -->
        <div class="main-content">
          <!-- 左侧边栏 - 分类树 -->
          <div class="sidebar">
            <div class="sidebar-header">
              <span>{{ t('app.categories') }}</span>
              <el-button :icon="Plus" size="small" circle @click="handleAddCategory" />
            </div>
            <CategoryTree
              :categories="categories"
              :selected-id="selectedCategoryId"
              @select="handleSelectCategory"
              @add="handleAddCategory"
              @edit="handleEditCategory"
              @delete="handleDeleteCategory"
            />
          </div>

          <!-- 右侧主区域 - 书签列表 -->
          <div class="content">
            <div class="content-header">
              <div class="content-title">
                <span>{{ currentCategoryName }}</span>
                <span class="count">({{ filteredBookmarks.length }})</span>
              </div>
              <div class="content-actions">
                <!-- 排序方式 -->
                <el-select v-model="settings.sortBy" size="small" style="width: 120px">
                  <el-option :label="t('sort.time')" value="time" />
                  <el-option :label="t('sort.lastVisit')" value="lastVisit" />
                  <el-option :label="t('sort.name')" value="name" />
                  <el-option :label="t('sort.visit')" value="visit" />
                </el-select>

                <!-- 视图切换 -->
                <el-radio-group v-model="settings.defaultView" size="small">
                  <el-radio-button value="list">
                    <el-icon><List /></el-icon>
                  </el-radio-button>
                  <el-radio-button value="grid">
                    <el-icon><Grid /></el-icon>
                  </el-radio-button>
                  <el-radio-button value="card">
                    <el-icon><Postcard /></el-icon>
                  </el-radio-button>
                </el-radio-group>
                
                <el-button :icon="Plus" type="primary" size="small" @click="handleAddBookmark">
                  {{ t('app.newBookmark') }}
                </el-button>
                <el-dropdown @command="handleImportExport">
                  <el-button :icon="More" size="small" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="import-browser">
                        <el-icon><Download /></el-icon>
                        {{ t('importExport.importBrowser') }}
                      </el-dropdown-item>
                      <el-dropdown-item command="export-browser">
                        <el-icon><Upload /></el-icon>
                        {{ t('importExport.exportBrowser') }}
                      </el-dropdown-item>
                      <el-dropdown-item divided command="export-json">
                        <el-icon><Document /></el-icon>
                        {{ t('importExport.exportJson') }}
                      </el-dropdown-item>
                      <el-dropdown-item command="export-html">
                        <el-icon><Document /></el-icon>
                        {{ t('importExport.exportHtml') }}
                      </el-dropdown-item>
                      <el-dropdown-item command="import-json">
                        <el-icon><FolderOpened /></el-icon>
                        {{ t('importExport.importJson') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>

            <BookmarkList
              :bookmarks="filteredBookmarks"
              :view-mode="settings.defaultView"
              :show-favicon="settings.showFavicon"
              :show-description="settings.showDescription"
              @click="handleBookmarkClick"
              @edit="handleEditBookmark"
              @delete="handleDeleteBookmark"
            />
          </div>
        </div>
      </template>

      <!-- 对话框 -->
      <SettingsDialog v-model="showSettings" />
      <BookmarkEditDialog
        v-model="showBookmarkEdit"
        :bookmark="editingBookmark"
        :categories="categories"
        :initial-category-id="selectedCategoryId || undefined"
        @submit="handleBookmarkSubmit"
      />
      <TagManager v-if="showTagManager" v-model="showTagManager" />
      <CategoryEditDialog
        v-model="showCategoryEdit"
        :category="editingCategory"
        :default-parent-id="selectedCategoryId"
        @submit="handleCategorySubmit"
      />
      <BookmarkDetailDialog
        v-model="showBookmarkDetail"
        :bookmark="viewingBookmark"
        :categories="categories"
        @edit="handleEditBookmark"
        @delete="handleDeleteBookmark"
        @open="handleBookmarkOpen"
      />
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, ElConfigProvider } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useBookmarkStore } from '@/stores/bookmark'
import { useCategoryStore } from '@/stores/category'
import { useSettingsStore, elLocale } from '@/stores/settings'
import CategoryTree from './components/CategoryTree.vue'
import BookmarkList from './components/BookmarkList.vue'
import SettingsDialog from './components/dialogs/SettingsDialog.vue'
import BookmarkEditDialog from './components/dialogs/BookmarkEditDialog.vue'
import TagManager from './components/dialogs/TagManager.vue'
import BookmarkForm from './components/BookmarkForm.vue'
import CategoryEditDialog from './components/dialogs/CategoryEditDialog.vue'
import BookmarkDetailDialog from './components/dialogs/BookmarkDetailDialog.vue'
import {
  Collection,
  Plus,
  Search,
  Setting,
  PriceTag,
  List,
  Grid,
  Postcard,
  More,
  Download,
  Upload,
  Document,
  FolderOpened,
  Close
} from '@element-plus/icons-vue'
import { importFromBrowser, exportToBrowser } from '@/services/import'
import { storageService } from '@/services/storage'
import { searchBookmarks } from '@/services/search'
import { getFaviconUrl } from '@/utils/favicon'
import type { Bookmark, Category } from '@/types'

const { t } = useI18n()

const bookmarkStore = useBookmarkStore()
const categoryStore = useCategoryStore()
const settingsStore = useSettingsStore()

const { bookmarks } = storeToRefs(bookmarkStore)
const { categories } = storeToRefs(categoryStore)
const { settings } = storeToRefs(settingsStore)

const searchQuery = ref('')
const searchInputRef = ref<any>(null)
const debouncedSearchQuery = ref('')
let searchTimeout: any = null

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = searchQuery.value
  }, 300)
}

const selectedCategoryId = ref<string | null>(null)
const showSettings = ref(false)
const showBookmarkEdit = ref(false)
const showTagManager = ref(false)
const showCategoryEdit = ref(false)
const showBookmarkDetail = ref(false)

const editingBookmark = ref<Bookmark | undefined>(undefined)
const editingCategory = ref<Category | undefined>(undefined)
const viewingBookmark = ref<Bookmark | null>(null)

// Standalone Mode State
const isStandalone = ref(false)
const standaloneForm = ref<Partial<Bookmark>>({})

// 当前分类名称
const currentCategoryName = computed(() => {
  if (!selectedCategoryId.value) return t('app.allBookmarks')
  if (selectedCategoryId.value === 'default') return t('category.default')
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || t('app.allBookmarks')
})

// 过滤后的书签
const filteredBookmarks = computed(() => {
  let result = searchBookmarks(
    bookmarks.value,
    debouncedSearchQuery.value,
    selectedCategoryId.value ? { categoryId: selectedCategoryId.value } : undefined
  )

  const sortBy = settings.value.sortBy
  return result.sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return b.createdAt - a.createdAt
      case 'lastVisit':
        return (b.lastVisit || 0) - (a.lastVisit || 0)
      case 'name':
        return a.title.localeCompare(b.title)
      case 'visit':
        return (b.visitCount || 0) - (a.visitCount || 0)
      default:
        return 0
    }
  })
})

const handleSelectCategory = (categoryId: string | null) => {
  selectedCategoryId.value = categoryId
}

const handleAddCategory = () => {
  editingCategory.value = undefined
  showCategoryEdit.value = true
}

const handleEditCategory = (id: string) => {
  const category = categories.value.find(c => c.id === id)
  if (category) {
    editingCategory.value = category
    showCategoryEdit.value = true
  }
}

const handleCategorySubmit = async (data: Partial<Category>) => {
  try {
    if (data.id) {
      await categoryStore.updateCategory(data.id, data)
      ElMessage.success(t('category.updateSuccess'))
    } else {
      await categoryStore.addCategory({
        name: data.name!,
        parentId: data.parentId,
        icon: data.icon!,
        color: data.color!,
        order: 0,
        collapsed: false
      })
      ElMessage.success(t('category.createSuccess'))
    }
  } catch (error) {
    ElMessage.error(t('common.operationFailed', { error }))
  }
}

const handleDeleteCategory = (id: string) => {
  ElMessageBox.confirm(
    t('category.deleteConfirm'),
    t('common.warning'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    categoryStore.deleteCategory(id)
    if (selectedCategoryId.value === id) {
      selectedCategoryId.value = null
    }
    ElMessage.success(t('category.deleteSuccess'))
  }).catch(() => {})
}

const handleAddBookmark = () => {
  editingBookmark.value = undefined
  showBookmarkEdit.value = true
}

const handleEditBookmark = (id: string) => {
  const bookmark = bookmarks.value.find(b => b.id === id)
  if (bookmark) {
    editingBookmark.value = bookmark
    showBookmarkEdit.value = true
    showBookmarkDetail.value = false
  }
}

const handleBookmarkSubmit = async (data: Partial<Bookmark>) => {
  try {
    if (data.id) {
      await bookmarkStore.updateBookmark(data.id, data)
      ElMessage.success(t('bookmark.updateSuccess'))
    } else {
      await bookmarkStore.addBookmark({
        title: data.title!,
        url: data.url!,
        categoryId: data.categoryId || selectedCategoryId.value || 'default',
        description: data.description || '',
        tags: data.tags || [],
        favicon: data.favicon || '',
        order: 0,
        visitCount: 0,
        lastVisit: null
      })
      ElMessage.success(t('bookmark.addSuccess'))
    }
  } catch (error: any) {
    ElMessage.error(error.message || t('common.operationFailed', { error }))
  }
}

const handleDeleteBookmark = (id: string) => {
  ElMessageBox.confirm(t('bookmark.deleteConfirm'), t('common.warning'), {
    confirmButtonText: t('common.confirm'),
    cancelButtonText: t('common.cancel'),
    type: 'warning'
  }).then(() => {
    bookmarkStore.deleteBookmark(id)
    ElMessage.success(t('bookmark.deleteSuccess'))
  }).catch(() => {})
}

const handleBookmarkClick = (bookmark: any) => {
  viewingBookmark.value = bookmark
  showBookmarkDetail.value = true
}

const handleBookmarkOpen = async (id: string) => {
  await bookmarkStore.incrementVisitCount(id)
  if (viewingBookmark.value && viewingBookmark.value.id === id) {
    const updated = bookmarkStore.bookmarks.find(b => b.id === id)
    if (updated) {
      viewingBookmark.value = { ...updated }
    }
  }
}

const handleImportExport = async (command: string) => {
  try {
    switch (command) {
      case 'import-browser':
        const result = await importFromBrowser()
        ElMessage.success(t('importExport.importSuccess', { categories: result.categories, bookmarks: result.bookmarks }))
        await bookmarkStore.loadBookmarks()
        await categoryStore.loadCategories()
        break

      case 'export-browser':
        const count = await exportToBrowser()
        ElMessage.success(t('importExport.exportSuccess', { count }))
        break

      case 'export-json':
        const json = await storageService.exportToJSON()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookmarks-${Date.now()}.json`
        a.click()
        ElMessage.success(t('importExport.exportJsonSuccess'))
        break

      case 'export-html':
        const html = await storageService.exportToHTML()
        const htmlBlob = new Blob([html], { type: 'text/html' })
        const htmlUrl = URL.createObjectURL(htmlBlob)
        const htmlA = document.createElement('a')
        htmlA.href = htmlUrl
        htmlA.download = `bookmarks-${Date.now()}.html`
        htmlA.click()
        URL.revokeObjectURL(htmlUrl)
        ElMessage.success(t('importExport.exportHtmlSuccess'))
        break

      case 'import-json':
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              try {
                const jsonStr = event.target?.result as string
                await storageService.importFromJSON(jsonStr)
                ElMessage.success(t('importExport.importJsonSuccess'))
                await bookmarkStore.loadBookmarks()
                await categoryStore.loadCategories()
              } catch (error) {
                ElMessage.error(t('importExport.importJsonFailed', { error }))
              }
            }
            reader.readAsText(file)
          }
        }
        input.click()
        break
    }
  } catch (error) {
    ElMessage.error(t('importExport.operationFailed', { error }))
  }
}

const handleStandaloneSubmit = async (data: Partial<Bookmark>) => {
  try {
    const url = data.url!
    await bookmarkStore.addBookmark({
      title: data.title!,
      url,
      categoryId: data.categoryId || 'default',
      description: data.description || '',
      tags: data.tags || [],
      favicon: getFaviconUrl(url),
      order: 0,
      visitCount: 0,
      lastVisit: null
    })
    ElMessage.success(t('bookmark.addSuccess'))
    setTimeout(() => {
      closeWindow()
    }, 1000)
  } catch (error: any) {
    ElMessage.error(error.message || t('common.operationFailed', { error }))
  }
}

const closeWindow = () => {
  window.close()
}

const applyTheme = (theme: string) => {
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

watch(() => settings.value.theme, (newTheme) => {
  applyTheme(newTheme)
})

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (settings.value.theme === 'auto') {
    applyTheme('auto')
  }
})

onMounted(async () => {
  await bookmarkStore.loadBookmarks()
  await categoryStore.loadCategories()
  await settingsStore.loadSettings()
  
  applyTheme(settings.value.theme)

  // Global keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (!settings.value.enableShortcuts) return

    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    if (e.key === '/') {
      e.preventDefault()
      searchInputRef.value?.focus()
    } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      handleAddBookmark()
    }
  })
  
  const params = new URLSearchParams(window.location.search)
  const action = params.get('action')
  const mode = params.get('mode')
  
  if (mode === 'standalone') {
    isStandalone.value = true
  } else {
    // 非独立窗口模式下，默认聚焦搜索框
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 100)
  }

  if (action === 'add') {
    const url = params.get('url')
    const title = params.get('title')
    const categoryId = params.get('categoryId')

    if (url && title) {
      if (isStandalone.value) {
        standaloneForm.value = {
          title,
          url,
          categoryId: categoryId || 'default'
        }
      } else {
        editingBookmark.value = {
          id: '',
          title,
          url,
          categoryId: categoryId || 'default',
          description: '',
          tags: [],
          favicon: '',
          order: 0,
          visitCount: 0,
          lastVisit: null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        showBookmarkEdit.value = true
      }
    }
  }
})
</script>

<style scoped>
.app-container {
  width: 800px;
  height: 580px;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.header {
  height: 60px;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.search-input {
  width: 300px;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 210px;
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  gap: var(--spacing-sm);
}

.content-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  min-width: 0;
  flex: 1;
}

.content-title span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.count {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: normal;
}

.content-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

/* Standalone Mode Styles */
.standalone-mode {
  background: var(--bg-secondary);
  padding: 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.standalone-card {
  background: var(--bg-primary);
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none;
}

.standalone-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
  flex-shrink: 0;
}

.standalone-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.standalone-body {
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

/* Make form more compact in standalone mode */
.standalone-mode :deep(.el-form-item) {
  margin-bottom: 16px;
}

.standalone-mode :deep(.form-actions) {
  margin-top: 24px;
}
</style>
