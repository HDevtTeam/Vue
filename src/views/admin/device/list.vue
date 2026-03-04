<template>
  <div class="device-container">
    <div class="header">
      <h1>设备管理</h1>
      <el-button type="primary" @click="handleAdd">新增设备</el-button>
    </div>

    <el-table :data="deviceList" border stripe v-loading="loading">
      <el-table-column prop="id" label="设备编号" width="120" />
      <el-table-column prop="name" label="设备名称" width="150" />
      <el-table-column prop="model" label="设备型号" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '在线' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orgName" label="所属组织" width="150" />
      <el-table-column prop="ownerName" label="归属人" width="120" />
      <el-table-column prop="rtmp" label="RTMP地址" min-width="250" show-overflow-tooltip />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleConfig(row)">RTMP</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mockDevices } from '@/api/mock'
import { useRouter } from 'vue-router'

const router = useRouter()
const deviceList = ref([])
const loading = ref(false)

// 获取设备列表（模拟）
const fetchDeviceList = async () => {
  loading.value = true
  try {
    // 模拟接口调用
    await new Promise(resolve => setTimeout(resolve, 500))
    deviceList.value = mockDevices
    ElMessage.success('获取成功')
  } catch (error) {
    console.error('获取失败:', error)
    ElMessage.error('获取失败')
  } finally {
    loading.value = false
  }
}

// 详情
const handleDetail = (row) => {
  router.push(`/device/detail/${row.id}`)
}

// 编辑
const handleEdit = (row) => {
  // 打开弹窗，传入选中的行
  openDialog('edit', row)
}

// RTMP配置
const handleConfig = (row) => {
  router.push(`/device/config/${row.id}`)
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除设备【${row.name}】吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    // 模拟删除
    await new Promise(resolve => setTimeout(resolve, 300))
    deviceList.value = deviceList.value.filter(d => d.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 新增
const handleAdd = () => {
  openDialog('add')
}

onMounted(fetchDeviceList)
</script>