<template>
  <div class="users-container">
    <div class="header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="handleAdd">新增用户</el-button>
    </div>

    <!-- 搜索栏（可选） -->
    <el-card class="search-card" v-if="showSearch">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="用户名">
          <el-input v-model="searchForm.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="common" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表表格 -->
    <el-card>
      <el-table :data="userList" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="用户名" width="150" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ row.status === 'normal' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '新增用户' : '编辑用户'"
      width="500px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="dialogType === 'add'">
          <el-input 
            v-model="formData.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="common" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="正常" value="normal" />
            <el-option label="禁用" value="disabled" />
          </el-select>
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
import { getUserList, addUser, updateUser, deleteUser } from '@/api/user'

// ==================== 状态变量 ====================
const userList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const showSearch = ref(true)

// 搜索表单
const searchForm = ref({
  name: '',
  role: '',
  status: ''
})

// 弹窗控制
const dialogVisible = ref(false)
const dialogType = ref('add')
const submitting = ref(false)
const formRef = ref(null)

// 表单数据
const formData = ref({
  id: null,
  name: '',
  password: '',
  role: 'common',
  status: 'normal'
})

// ==================== 表单验证规则 ====================
const rules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// ==================== 工具函数 ====================
const normalizeRole = (role) => {
  const normalized = String(role || '').trim().toLowerCase()
  if (normalized === 'user' || normalized === 'common') return 'common'
  if (normalized === 'admin') return 'admin'
  if (normalized === 'inspector') return 'inspector'
  return 'common'
}

const getRoleTagType = (role) => {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return 'danger'
  if (normalized === 'inspector') return 'warning'
  return 'success'
}

const getRoleLabel = (role) => {
  const normalized = normalizeRole(role)
  if (normalized === 'admin') return '管理员'
  if (normalized === 'inspector') return '巡查员'
  return '普通用户'
}

const getRoleSubmitCandidates = (role) => {
  const normalized = normalizeRole(role)
  const candidates = [normalized]
  // 后端 RoleEnum 仅接受 [common, admin]，巡查员回落为普通用户
  if (normalized === 'inspector') candidates.push('common')
  return [...new Set(candidates.filter(Boolean))]
}

const getErrorMessage = (error) => {
  return (
    error?.response?.data?.msg ||
    error?.response?.data?.message ||
    error?.response?.data?.commonResultResponse?.message ||
    error?.message ||
    '操作失败'
  )
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// ==================== 获取用户列表 ====================
console.log('fetchUserList 被调用了！')
const fetchUserList = async () => {
  console.log('fetchUserList 被调用了！')
  loading.value = true
  
  try {
    // 真实接口
    const res = await getUserList()
    console.log('获取用户列表返回：', res)
    
    // 后端返回结构：{ commonResultResponse: {...}, userList: [...] }
    const rawList = res.userList || res.users || []
    userList.value = rawList.map(item => ({
      ...item,
      role: normalizeRole(item.role)
    }))
    total.value = userList.value.length
    
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    
    // 接口失败时用空数组
    userList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ==================== 搜索 ====================
const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

const resetSearch = () => {
  searchForm.value = {
    name: '',
    role: '',
    status: ''
  }
  handleSearch()
}

// ==================== 分页 ====================
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// ==================== 新增用户 ====================
const handleAdd = () => {
  dialogType.value = 'add'
  formData.value = {
    id: null,
    name: '',
    password: '',
    role: 'common',
    status: 'normal'
  }
  dialogVisible.value = true
}

// ==================== 编辑用户 ====================
const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.value = {
    id: row.id,
    name: row.name,
    password: '',
    role: normalizeRole(row.role) || 'common',
    status: row.status
  }
  dialogVisible.value = true
}

// ==================== 删除用户 ====================
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户【${row.name}】吗？`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUserList()
    } catch (error) {
      console.error('删除失败：', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// ==================== 提交表单 ====================
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      // 新增只需要 name 和 password
      await addUser({
        name: formData.value.name,
        password: formData.value.password
      })
      ElMessage.success('新增成功')
    } else {
      // 编辑需要完整对象
      const baseData = {
        id: formData.value.id,
        name: formData.value.name,
        role: normalizeRole(formData.value.role),
        status: formData.value.status
      }
      // 如果密码有值，则修改密码
      if (formData.value.password) {
        baseData.password = formData.value.password
      }

      const roleCandidates = getRoleSubmitCandidates(baseData.role)
      const payload = { ...baseData, role: roleCandidates[0] || 'common' }
      await updateUser(baseData.id, payload)

      ElMessage.success('修改成功')
    }

    dialogVisible.value = false
    fetchUserList()
  } catch (error) {
    console.error('操作失败：', error)
    ElMessage.error(getErrorMessage(error))
  } finally {
    submitting.value = false
  }
}

// ==================== 页面加载时获取数据 ====================
onMounted(() => {
  fetchUserList()
})
</script>

<style scoped>
.users-container {
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

.search-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  margin-top: 10px;
}
</style>