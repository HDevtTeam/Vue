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
            <el-option label="巡查员" value="inspector" />
            <el-option label="普通用户" value="user" />
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
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'inspector' ? 'warning' : 'success'">
              {{ row.role === 'admin' ? '管理员' : row.role === 'inspector' ? '巡查员' : '普通用户' }}
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
            <el-option label="巡查员" value="inspector" />
            <el-option label="普通用户" value="user" />
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
import request from '@/utils/request'

// ==================== 模拟数据（完全按照接口文档格式）====================
const MOCK_USERS = [
  {
    id: 1,
    name: "admin",
    role: "admin",
    status: "normal",
    password: "123456",
    createTime: "2026-01-01T10:00:00",
    updateTime: "2026-03-01T14:30:00",
    organizationId: null
  },
  {
    id: 2,
    name: "inspector1",
    role: "inspector",
    status: "normal",
    password: "123456",
    createTime: "2026-01-15T09:20:00",
    updateTime: "2026-02-28T16:45:00",
    organizationId: 1
  },
  {
    id: 3,
    name: "user1",
    role: "user",
    status: "disabled",
    password: "123456",
    createTime: "2026-02-01T11:30:00",
    updateTime: "2026-03-02T09:15:00",
    organizationId: null
  }
]

// ==================== 状态变量 ====================
const userList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const showSearch = ref(true)  // 是否需要搜索栏

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
  role: 'user',
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
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// ==================== 获取用户列表 ====================
const fetchUserList = async () => {
  console.log('fetchUserList 被调用了！')
  loading.value = true
  
  try {
    // 模拟接口调用（延迟500ms）
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟搜索过滤
    let filteredUsers = [...MOCK_USERS]
    if (searchForm.value.name) {
      filteredUsers = filteredUsers.filter(u => 
        u.name.toLowerCase().includes(searchForm.value.name.toLowerCase())
      )
    }
    if (searchForm.value.role) {
      filteredUsers = filteredUsers.filter(u => u.role === searchForm.value.role)
    }
    if (searchForm.value.status) {
      filteredUsers = filteredUsers.filter(u => u.status === searchForm.value.status)
    }
    
    // 完全按照接口文档的返回格式
    const res = {
      users: filteredUsers,
      commonResultResponse: {
        code: 200,
        message: "success"
      }
    }
    
    console.log('获取用户列表返回：', res)
    userList.value = res.users || []
    total.value = userList.value.length
    
  } catch (error) {
    console.error('获取用户列表失败,使用模拟数据：', error)
    userList.value = MOCK_USERS
    total.value = userList.value.length
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
  // 前端分页，不需要重新请求
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
    role: 'user',
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
    password: '',  // 编辑时密码留空
    role: row.role,
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
      // 模拟删除
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从模拟数据中删除
      const index = MOCK_USERS.findIndex(u => u.id === row.id)
      if (index !== -1) {
        MOCK_USERS.splice(index, 1)
      }
      
      ElMessage.success('删除成功')
      fetchUserList()  // 刷新列表
    } catch (error) {
      console.error('删除失败：', error)
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
        // 模拟接口调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (dialogType.value === 'add') {
          // 新增用户（按文档只需要 name 和 password）
          const newUser = {
            id: MOCK_USERS.length + 1,
            name: formData.value.name,
            password: formData.value.password,
            role: formData.value.role || 'user',
            status: formData.value.status || 'normal',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            organizationId: null
          }
          MOCK_USERS.push(newUser)
          ElMessage.success('新增成功')
        } else {
          // 编辑用户
          const user = MOCK_USERS.find(u => u.id === formData.value.id)
          if (user) {
            user.name = formData.value.name
            user.role = formData.value.role
            user.status = formData.value.status
            if (formData.value.password) {
              user.password = formData.value.password
            }
            user.updateTime = new Date().toISOString()
          }
          ElMessage.success('修改成功')
        }
        
        dialogVisible.value = false
        fetchUserList()  // 刷新列表
      } catch (error) {
        console.error('操作失败：', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
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