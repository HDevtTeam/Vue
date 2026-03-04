<template>
  <div class="detail-container">
    <div class="header">
      <el-button @click="goBack">返回列表</el-button>
      <h2>设备详情</h2>
    </div>

    <el-card v-loading="loading">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备编号">{{ device.id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ device.name }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ device.model }}</el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <el-tag :type="device.status === '在线' ? 'success' : device.status === '离线' ? 'info' : 'warning'">
            {{ device.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="所属组织">{{ device.orgName }}</el-descriptions-item>
        <el-descriptions-item label="归属人">{{ device.ownerName }}</el-descriptions-item>
        <el-descriptions-item label="RTMP地址" :span="2">
          {{ device.rtmp }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ device.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ device.updateTime }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

// ==================== 模拟数据 ====================
const MOCK_DEVICES = {
  DEV001: {
    id: 'DEV001',
    name: '无人机-01',
    model: 'DJI Mavic 3',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/001',
    orgName: '北京项目部',
    ownerName: '张三',
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-03-01 14:30:00'
  }
}

const route = useRoute()
const router = useRouter()
const device = ref({})
const loading = ref(false)

const fetchDeviceDetail = async () => {
  const id = route.params.id
  loading.value = true
  
  try {
    // ========== 模拟数据 ==========
    await new Promise(resolve => setTimeout(resolve, 300))
    device.value = MOCK_DEVICES[id] || {}
    
    // ========== 真实接口 ==========
    // const res = await request.get(`/api/devices/${id}`)
    // device.value = res.data
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(fetchDeviceDetail)
</script>

<style scoped>
.detail-container {
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}
</style>