<template>
  <div class="device-container">
    <div class="header">
      <h1>设备管理</h1>
      <el-button type="primary" @click="handleAdd">新增设备</el-button>
    </div>

    <el-table :data="deviceList" border stripe v-loading="loading">
      <el-table-column prop="id" label="设备编号" width="100" />
      <el-table-column prop="name" label="设备名称" width="150" />
      <el-table-column prop="sn" label="SN" width="160" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="organizationId" label="组织ID" width="100" />
      <el-table-column prop="userId" label="用户ID" width="90" />
      <el-table-column prop="createTime" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleDetail(row)">详情</el-button>
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleConfig(row)">RTMP</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <DeviceForm ref="formRef" @success="fetchDeviceList" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceList, deleteDeviceBySn } from '@/api/device'
import { useRouter } from 'vue-router'
import DeviceForm from './components/DeviceForm.vue'

const router = useRouter()
const deviceList = ref([])
const loading = ref(false)
const formRef = ref(null)

const statusText = (s) => {
  const map = { idle: '空闲', flying: '飞行中', maintenance: '维护中', fault: '故障' }
  return map[s] || s || '-'
}

const statusTagType = (s) => {
  const map = { idle: 'success', flying: 'warning', maintenance: 'info', fault: 'danger' }
  return map[s] || 'info'
}

const formatDate = (str) => {
  if (!str) return '-'
  const d = new Date(str)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fetchDeviceList = async () => {
  loading.value = true
  try {
    const res = await getDeviceList()
    deviceList.value = res.devices || []
  } catch (error) {
    console.error('获取设备列表失败:', error)
    ElMessage.error('获取设备列表失败')
    deviceList.value = []
  } finally {
    loading.value = false
  }
}

const handleDetail = (row) => {
  router.push(`/admin/device/detail/${row.id}`)
}

const handleEdit = (row) => {
  formRef.value?.open('edit', row)
}

const handleConfig = (row) => {
  router.push(`/admin/device/config/${encodeURIComponent(row.sn)}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除设备【${row.name}】吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDeviceBySn(row.sn)
      ElMessage.success('删除成功')
      fetchDeviceList()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleAdd = () => {
  formRef.value?.open('add')
}

onMounted(fetchDeviceList)
</script>

<style scoped>
.device-container {
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
</style>
