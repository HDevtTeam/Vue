<template>
  <div class="org-container">
    <div class="header">
      <h1>组织管理</h1>
      <el-button type="primary" @click="handleAdd">新增组织</el-button>
    </div>

    <el-card v-loading="loading">
      <el-tree
        :data="orgTree"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <span>{{ node.label }}</span>
            <span class="actions">
              <el-button type="primary" link @click="handleEdit(data)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(data)">删除</el-button>
              <el-button type="success" link @click="handleAddChild(data)">新增子组织</el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="上级组织" prop="parentId" v-if="!isEdit">
          <el-tree-select
            v-model="form.parentId"
            :data="orgTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级组织"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getOrganizationList,
  addOrganization, 
  updateOrganization, 
  deleteOrganization,
  deleteOrganizationsBatch
} from '@/api/organization'

// ==================== 状态变量 ====================
const orgTree = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增组织')
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = ref({
  id: null,
  name: '',
  parentId: null
})

const rules = {
  name: [
    { required: true, message: '请输入组织名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

// 将列表转换为树形结构，后端根节点 parentId 为 0
const buildTree = (list, parentId = 0) => {
  const tree = []
  list.forEach(item => {
    const itemParent = item.parentId ?? 0
    if (itemParent === parentId) {
      const children = buildTree(list, item.id)
      if (children.length) {
        item.children = children
      }
      tree.push(item)
    }
  })
  return tree
}

// ==================== 获取组织树 ====================
const fetchOrgTree = async () => {
  loading.value = true
  try {
    const res = await getOrganizationList()
    console.log('获取组织列表返回:', res)
    
    // 根据文档，数据在 res.organizationList 里
    const list = res.organizationList || []
    
    // 转换为树形结构，根节点 parentId=0
    orgTree.value = buildTree(list, 0)
    
  } catch (error) {
    console.error('获取组织列表失败:', error)
    ElMessage.error('获取组织列表失败')
    orgTree.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 新增 ====================
const handleAdd = () => {
  dialogTitle.value = '新增组织'
  isEdit.value = false
  form.value = { id: null, name: '', parentId: null }
  dialogVisible.value = true
}

// ==================== 新增子组织 ====================
const handleAddChild = (data) => {
  dialogTitle.value = '新增子组织'
  isEdit.value = false
  form.value = { id: null, name: '', parentId: data.id }
  dialogVisible.value = true
}

// ==================== 编辑 ====================
const handleEdit = (data) => {
  dialogTitle.value = '编辑组织'
  isEdit.value = true
  form.value = { 
    id: data.id, 
    name: data.name, 
    parentId: data.parentId 
  }
  dialogVisible.value = true
}

// ==================== 删除 ====================
const handleDelete = (data) => {
  // 收集所有要删除的ID（包括子组织）
  const collectIds = (node) => {
    let ids = [node.id]
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        ids = ids.concat(collectIds(child))
      })
    }
    return ids
  }

  const idsToDelete = collectIds(data)
  const message = idsToDelete.length > 1 
    ? `确定删除组织【${data.name}】及其下 ${idsToDelete.length - 1} 个子组织吗？`
    : `确定删除组织【${data.name}】吗？`

  ElMessageBox.confirm(
    message,
    '删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      if (idsToDelete.length > 1) {
        // 批量删除
        await deleteOrganizationsBatch(idsToDelete)
      } else {
        // 单个删除
        await deleteOrganization(data.id)
      }
      ElMessage.success('删除成功')
      fetchOrgTree()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ==================== 提交表单 ====================
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          // 编辑组织
          await updateOrganization({
            id: form.value.id,
            name: form.value.name,
            parentId: form.value.parentId
          })
          ElMessage.success('修改成功')
        } else {
          // 新增组织
          await addOrganization({
            name: form.value.name,
            parentId: form.value.parentId
          })
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchOrgTree()
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// ==================== 初始化 ====================
onMounted(() => {
  fetchOrgTree()
})
</script>

<style scoped>
.org-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.actions {
  display: flex;
  gap: 8px;
}

:deep(.el-tree-node__content) {
  height: 40px;
}
</style>