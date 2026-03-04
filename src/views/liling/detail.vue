<template>
  <div class="p-6">
    <el-card>
      <div class="mb-4">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </div>
      
      <h1 class="text-2xl font-bold mb-6">设备详情</h1>
      
      <el-descriptions :column="1" border>
        <el-descriptions-item label="设备编号">{{ device?.id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ device?.name }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ device?.model }}</el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <el-tag :type="device?.status === '在线' ? 'success' : 'info'">
            {{ device?.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="RTMP地址">{{ device?.rtmp }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const device = ref(null)

// 从 URL 获取设备 ID
const deviceId = route.params.id

// 模拟数据（实际应该从接口获取）
const deviceList = [
  {
    id: 'DEV001',
    name: '无人机-01',
    model: 'DJI Mavic 3',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/001'
  },
  {
    id: 'DEV002',
    name: '无人机-02',
    model: 'DJI Air 2S',
    status: '离线',
    rtmp: 'rtmp://live.example.com/stream/002'
  },
  {
    id: 'DEV003',
    name: '无人机-03',
    model: 'Autel EVO II',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/003'
  },
  {
    id: 'DEV004',
    name: '无人机-04',
    model: 'DJI Mini 3 Pro',
    status: '维护',
    rtmp: 'rtmp://live.example.com/stream/004'
  },
  {
    id: 'DEV005',
    name: '无人机-05',
    model: 'Hubsan Zino Pro',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/005'
  }
]

// 根据 ID 查找设备
onMounted(() => {
  const found = deviceList.find(item => item.id === deviceId)
  if (found) {
    device.value = found
  } else {
    ElMessage.error('设备不存在')
    router.push('/liling')
  }
})

const goBack = () => {
  router.push('/liling')
}
</script>
