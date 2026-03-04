<template>
  <div class="config-container">
    <div class="header">
      <el-button @click="goBack">返回列表</el-button>
      <h2>RTMP配置</h2>
    </div>

    <el-card v-loading="loading">
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备名称">
          <span>{{ device.name }}</span>
        </el-form-item>
        <el-form-item label="设备型号">
          <span>{{ device.model }}</span>
        </el-form-item>
        <el-form-item label="当前RTMP地址">
          <span>{{ device.rtmp || '未配置' }}</span>
        </el-form-item>
        <el-form-item label="新RTMP地址">
          <el-input 
            v-model="form.rtmpUrl" 
            placeholder="rtmp://live.example.com/stream/xxx"
            style="width: 400px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="saving">
            保存配置
          </el-button>
        </el-form-item>
      </el-form>
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
    rtmp: 'rtmp://live.example.com/stream/001'
  }
}

const route = useRoute()
const router = useRouter()
const device = ref({})
const loading = ref(false)
const saving = ref(false)

const form = ref({
  rtmpUrl: ''
})

const fetchDeviceDetail = async () => {
  const id = route.params.id
  loading.value = true
  
  try {
    // ========== 模拟数据 ==========
    await new Promise(resolve => setTimeout(resolve, 300))
    device.value = MOCK_DEVICES[id] || {}
    form.value.rtmpUrl = device.value.rtmp || ''
    
    // ========== 真实接口 ==========
    // const res = await request.get(`/api/devices/${id}`)
    // device.value = res.data
    // form.value.rtmpUrl = res.data.rtmp || ''
  } catch (error) {
    console.error('获取设备失败:', error)
    ElMessage.error('获取设备失败')
  } finally {
    loading.value = false
  }
}

const saveConfig = async () => {
  if (!form.value.rtmpUrl) {
    ElMessage.warning('请输入RTMP地址')
    return
  }
  
  saving.value = true
  try {
    // ========== 模拟保存 ==========
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // ========== 真实接口 ==========
    // await request.post(`/api/devices/${route.params.id}/rtmp`, {
    //   rtmpUrl: form.value.rtmpUrl
    // })
    
    ElMessage.success('配置保存成功')
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

onMounted(fetchDeviceDetail)
</script>

<style scoped>
.config-container {
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