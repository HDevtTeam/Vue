<template>
  <div class="config-container">
    <div class="header">
      <el-button @click="goBack">返回列表</el-button>
      <h2>RTMP配置</h2>
    </div>

    <el-card v-loading="loading">
      <el-form :model="form" label-width="120px">
        <el-form-item label="设备SN">
          <span>{{ deviceSn }}</span>
        </el-form-item>
        <el-form-item label="设备名称">
          <span>{{ device.name }}</span>
        </el-form-item>
        <el-form-item label="当前RTMP地址">
          <span>{{ device.rtmpUrl || '未配置' }}</span>
        </el-form-item>
        <el-form-item label="新RTMP地址">
          <el-input 
            v-model="form.rtmpUrl" 
            placeholder="rtmp://example.com/live/stream"
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
import { getDeviceBySn } from '@/api/device'

const route = useRoute()
const router = useRouter()
const deviceSn = ref('')
const device = ref({})
const loading = ref(false)
const saving = ref(false)

const form = ref({
  rtmpUrl: ''
})

const fetchDevice = async () => {
  // 路由参数 id 实际传入的是设备 SN
  deviceSn.value = route.params.id || ''
  if (!deviceSn.value) {
    ElMessage.error('缺少设备SN')
    return
  }
  loading.value = true
  try {
    const res = await getDeviceBySn(deviceSn.value)
    device.value = res.device || {}
    form.value.rtmpUrl = device.value.rtmpUrl || device.value.rtmp || ''
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
    // 文档中无 RTMP 配置接口，暂提示
    ElMessage.info('RTMP 配置接口未在文档中定义，请联系后端补充')
    saving.value = false
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

onMounted(fetchDevice)
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