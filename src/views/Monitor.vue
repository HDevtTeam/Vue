<template>
  <div class="monitor-page">
    <el-container class="full">
      <el-header class="top-bar">
        <div class="title-area">
          <div class="title">视频监控</div>
          <el-tag :type="statusTagType" class="status-tag">{{ connectionStatus }}</el-tag>
        </div>
        <div class="controls-area">
          <el-radio-group v-model="streamType" @change="switchStreamType" class="ctrl-item">
            <el-radio-button label="local">本地</el-radio-button>
            <el-radio-button label="rtmp">RTMP</el-radio-button>
          </el-radio-group>
          <el-input v-model="deviceSnQuery" placeholder="输入设备SN查询流" class="ctrl-item" @keyup.enter="queryStreams">
            <template #append>
              <el-button @click="queryStreams">查询</el-button>
            </template>
          </el-input>
          <el-input v-if="streamType==='rtmp' && !selectedDeviceId" v-model="rtmpUrl" placeholder="RTMP 地址" class="ctrl-item" @keyup.enter="handleConnect">
            <template #append>
              <el-button @click="handleConnect" :loading="isConnecting">连接</el-button>
            </template>
          </el-input>
        </div>
        <div class="action-area">
          <el-button type="primary" @click="handleConnect" :loading="isConnecting">开始</el-button>
          <el-button @click="retryConnection" :disabled="isConnecting">重试</el-button>
          <el-button type="danger" @click="handleDisconnect">断开</el-button>
          <el-button type="success" @click="startSelectedStream" :disabled="!selectedStreamId">启动流</el-button>
          <el-button type="warning" @click="stopSelectedStream" :disabled="!selectedStreamId">停止流</el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside width="300px" class="left-panel">
          <div class="panel-title">视频流列表</div>
          <el-scrollbar class="device-list">
            <div v-for="s in streams" :key="s.stream_id || s.streamId" class="device-item" :class="{ active: (s.stream_id||s.streamId)===selectedStreamId }" @click="selectStream(s)">
              <div class="device-name">{{ s.device_sn || s.deviceSn }}</div>
              <div class="device-meta">
                <el-tag size="small" type="info">{{ (s.stream_status||s.streamStatus) || '未知' }}</el-tag>
                <el-tag size="small" :type="(s.stream_id||s.streamId)===selectedStreamId ? statusTagType : 'info'">{{ (s.stream_id||s.streamId)===selectedStreamId ? connectionStatus : '未选中' }}</el-tag>
              </div>
              <div class="device-meta">
                <span class="mono">{{ s.stream_url || s.streamUrl }}</span>
              </div>
            </div>
          </el-scrollbar>
        </el-aside>
        <el-main class="main-panel">
          <div class="video-card">
            <div class="video-header">
              <div class="video-title">{{ selectedStream ? (selectedStream.device_sn || selectedStream.deviceSn) : '未选择流' }}</div>
              <div class="video-ops">
                <el-button size="small" @click="snapshot" :disabled="!imageData">截图</el-button>
                <el-button size="small" @click="enterFullscreen">全屏</el-button>
              </div>
            </div>
            <div class="video-body" ref="videoBoxRef">
              <img v-if="imageData" :src="imageData" class="video-stream" />
              <div v-else class="video-placeholder">
                <el-empty v-if="!isConnected && isConnecting" :description="getLoadingText()" />
                <el-empty v-else-if="!isConnected" description="未连接" />
              </div>
              <div class="video-overlay">
                <div class="kpis">
                  <div class="kpi">
                    <div class="kpi-label">FPS</div>
                    <div class="kpi-value">{{ streamData?.fps ?? 0 }}</div>
                  </div>
                  <div class="kpi">
                    <div class="kpi-label">速度</div>
                    <div class="kpi-value">{{ streamData?.speed ?? 0 }}</div>
                  </div>
                  <div class="kpi">
                    <div class="kpi-label">天气</div>
                    <div class="kpi-value">{{ streamData?.weather ?? '未知' }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="info-grid">
            <el-card class="info-card">
              <div class="info-title">当前视频流</div>
              <div class="info-row"><span>stream_id</span><span>{{ selectedStreamId || '-' }}</span></div>
              <div class="info-row"><span>device_sn</span><span>{{ selectedStream?.device_sn || selectedStream?.deviceSn || '-' }}</span></div>
              <div class="info-row"><span>stream_url</span><span class="mono">{{ selectedStream?.stream_url || selectedStream?.streamUrl || '-' }}</span></div>
              <div class="info-row"><span>stream_status</span><span>{{ selectedStream?.stream_status || selectedStream?.streamStatus || '-' }}</span></div>
              <div class="info-row"><span>start_time</span><span>{{ selectedStream?.start_time || selectedStream?.startTime || '-' }}</span></div>
              <div class="info-row"><span>stop_time</span><span>{{ selectedStream?.stop_time || selectedStream?.stopTime || '-' }}</span></div>
              <div class="info-row"><span>record_path</span><span class="mono">{{ selectedStream?.record_path || selectedStream?.recordPath || '-' }}</span></div>
            </el-card>
            <el-card class="info-card">
              <div class="info-title">事件日志</div>
              <el-scrollbar class="log-list">
                <div v-for="(l,idx) in logs" :key="idx" class="log-item">
                  <el-tag size="small" :type="logTypeTag(l.type)">{{ l.type }}</el-tag>
                  <span class="log-time">{{ formatTime(l.time) }}</span>
                  <span class="log-text">{{ l.message }}</span>
                </div>
              </el-scrollbar>
            </el-card>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import axios from 'axios'

const logs=ref([])
const addLog=(type,message)=>{
  logs.value.unshift({type,message,time:new Date()})
  if(logs.value.length>50) logs.value.pop()
}

const streams=ref([])
const selectedStreamId=ref(null)
const selectedStream=computed(()=>
  streams.value.find(s=>(s.stream_id||s.streamId)===selectedStreamId.value)||null
)
const deviceSnQuery=ref('')

const fetchAllStreams=async()=>{
  try{
    addLog('info','正在同步活跃的RTMP流...')
    // 直接使用axios请求，避免baseURL的影响
    const res=await axios.get('http://localhost:8081/rtmp/streams', { timeout: 10000 })
    
    // 处理后端返回的数据格式
    const list = res.data?.streams || []
    
    // 转换数据格式，确保与前端期望的格式一致
    streams.value = list.map(stream => ({
      streamId: stream.stream_name || stream.streamId,
      deviceSn: stream.stream_name || stream.deviceSn,
      streamUrl: stream.rtmp_url || stream.streamUrl,
      streamStatus: 'active',
      startTime: new Date().toISOString()
    }))
    
    if (list.length > 0) {
      addLog('success', `同步成功，当前有 ${list.length} 条活跃的RTMP流`)
    } else {
      addLog('info', '当前暂无活跃的RTMP流')
    }
  }catch(e){
    console.error('获取RTMP流列表失败:',e)
    addLog('error','获取流列表失败')
  }
}

onMounted(()=>{
  fetchAllStreams()
  connectLocalVideo()
})

const ws = ref(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const imageData = ref(null)
const streamData = ref(null)
const streamType = ref('local')
const rtmpUrl = ref('')
const videoBoxRef=ref(null)
const connectionStatus=computed(()=>isConnecting.value?'连接中':(isConnected.value?'在线':'离线'))
const statusTagType=computed(()=>isConnecting.value?'warning':(isConnected.value?'success':'danger'))

// 获取加载文本
const getLoadingText = () => {
  if (streamType.value === 'rtmp') {
    return '正在连接RTMP流...'
  }
  return '正在连接原始视频流...'
}

// 获取来源文本
const getSourceText = () => {
  if (!streamData.value) return ''
  
  if (streamType.value === 'local') {
    return '原始视频'
  } else {
    return rtmpUrl.value ? '自定义RTMP流' : '默认RTMP流'
  }
}

// 处理WebSocket消息
const handleWebSocketMessage = (event) => {
  try {
    const data = JSON.parse(event.data)
    
    // 验证数据完整性
    if (!data.image) {
      console.warn('收到的数据缺少图像信息')
      return
    }
    
    // 更新图像数据
    imageData.value = `data:image/jpeg;base64,${data.image}`
    
    // 更新流数据，使用默认值处理可能缺失的字段
    streamData.value = {
      fps: data.fps || 0,
      speed: data.speed || 0,
      weather: data.weather || '未知',
      source: data.source || '本地'
    }
    
    // 第一次收到数据时显示通知
    if (isConnecting.value) {
      isConnecting.value = false
      isConnected.value = true
    }
  } catch (error) {
    console.error('解析视频流数据失败:', error)
  }
}

// 处理WebSocket错误
const handleWebSocketError = (error) => {
  isConnected.value = false
  isConnecting.value = false
  ElMessage.error(`${streamType.value === 'local' ? '原始视频' : 'RTMP'}流连接错误`)
  console.error('WebSocket错误:', error)
  addLog('error','连接错误')
}

// 处理WebSocket关闭
const handleWebSocketClose = (sourceName, event) => {
  isConnected.value = false
  isConnecting.value = false
  
  if (event && event.code === 1008) {
    ElMessage.error(`${sourceName}连接失败: ${event.reason}`)
  } else if (streamType.value === 'local' && sourceName === '本地视频流' || 
            (streamType.value === 'rtmp' && sourceName === 'RTMP流')) {
    ElMessage.warning(`${sourceName}连接已关闭`)
  }
  addLog('close',`${sourceName}关闭`)
}

// 连接原始视频WebSocket
const connectLocalVideo = () => {
  closeWebSocket()
  isConnecting.value = true
  imageData.value = null
  streamData.value = null
  
  // 设置连接超时
  const connectionTimeout = setTimeout(() => {
    if (ws.value && ws.value.readyState !== WebSocket.OPEN) {
      ElMessage.error('原始视频流连接超时')
      closeWebSocket()
      isConnecting.value = false
    }
  }, 10000) // 10秒超时
  
  try {
    ws.value = new WebSocket('ws://localhost:8081/ws/rtmp/raw')

    ws.value.onopen = () => {
      clearTimeout(connectionTimeout)
      isConnected.value = true
      isConnecting.value = false
      ElMessage.success('原始视频流连接成功')
      addLog('open','原始视频已连接')
      
      // 设置数据接收超时
      startDataTimeout()
    }

    ws.value.onmessage = (event) => {
      // 重置数据超时计时器
      resetDataTimeout()
      handleWebSocketMessage(event)
    }
    
    ws.value.onerror = (error) => {
      clearTimeout(connectionTimeout)
      handleWebSocketError(error)
    }
    
    ws.value.onclose = (event) => {
      clearTimeout(connectionTimeout)
      handleWebSocketClose('原始视频流', event)
    }
  } catch (error) {
    clearTimeout(connectionTimeout)
    ElMessage.error(`原始视频流连接失败: ${error.message}`)
    isConnecting.value = false
    console.error('WebSocket创建错误:', error)
    addLog('error','原始视频连接失败')
  }
}

const connectSelectedStream=()=>{
  closeWebSocket()
  isConnecting.value=true
  imageData.value=null
  streamData.value=null

  const url=selectedStream.value?.streamUrl || selectedStream.value?.stream_url
  if(!url){
    ElMessage.error('当前流缺少 streamUrl，无法连接')
    isConnecting.value=false
    return
  }
  const wsUrl=`ws://localhost:8081/ws/rtmp?rtmp_url=${encodeURIComponent(url)}`
  ws.value=new WebSocket(wsUrl)

  ws.value.onopen=()=>{
    isConnected.value=true
    isConnecting.value=false
    addLog('open','设备RTMP已连接')
  }
  ws.value.onmessage=(event)=>{
    resetDataTimeout()
    handleWebSocketMessage(event)
  }
  ws.value.onerror=handleWebSocketError
  ws.value.onclose = (event) => handleWebSocketClose('RTMP流', event)
  startDataTimeout()
}

// 连接RTMP流
const connectRTMP = () => {
  closeWebSocket()
  isConnecting.value = true
  imageData.value = null
  streamData.value = null
  
  let wsUrl = 'ws://localhost:8081/ws/rtmp';
  
  // 如果提供了URL，则添加为查询参数
  if (rtmpUrl.value.trim()) {
    const encodedUrl = encodeURIComponent(rtmpUrl.value.trim())
    wsUrl = `${wsUrl}?rtmp_url=${encodedUrl}`;
  }
  
  // 设置连接超时
  const connectionTimeout = setTimeout(() => {
    if (ws.value && ws.value.readyState !== WebSocket.OPEN) {
      ElMessage.error('RTMP流连接超时，请检查流地址是否正确')
      closeWebSocket()
      isConnecting.value = false
    }
  }, 10000) // 10秒超时
  
  try {
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      clearTimeout(connectionTimeout)
      isConnected.value = true
      isConnecting.value = false
     ElMessage.success('RTMP流连接成功')
      addLog('open','RTMP已连接')
      
      // 设置数据接收超时
      startDataTimeout()
    }

    ws.value.onmessage = (event) => {
      // 重置数据超时计时器
      resetDataTimeout()
      handleWebSocketMessage(event)
    }
    
    ws.value.onerror = (error) => {
      clearTimeout(connectionTimeout)
      handleWebSocketError(error)
    }
    
    ws.value.onclose = (event) => {
      clearTimeout(connectionTimeout)
      handleWebSocketClose('RTMP流', event)
    }
  } catch (error) {
    clearTimeout(connectionTimeout)
    ElMessage.error(`RTMP流连接失败: ${error.message}`)
    isConnecting.value = false
    console.error('WebSocket创建错误:', error)
    addLog('error','RTMP连接失败')
  }
}

// 数据接收超时处理
let dataTimeoutId = null

const startDataTimeout = () => {
  dataTimeoutId = setTimeout(() => {
    if (isConnected.value && !streamData.value) {
      ElMessage.warning('RTMP流连接成功但未收到数据，请检查流地址是否有效')
      // 不断开连接，继续等待数据
    }
  }, 8000) // 8秒内没收到数据就提示
}

const resetDataTimeout = () => {
  if (dataTimeoutId) {
    clearTimeout(dataTimeoutId)
    dataTimeoutId = null
  }
}

// 切换流类型
const switchStreamType = (type) => {
  // 清除当前状态
  resetDataTimeout()
  imageData.value = null
  streamData.value = null
  isConnected.value = false
  
  // 根据类型连接不同的流
  if (type === 'local') {
    connectLocalVideo()
  } else if (type === 'rtmp') {
    if(selectedStreamId.value){connectSelectedStream()}else{connectRTMP()}
  }
}

// 重试当前连接
const retryConnection = () => {
  if (streamType.value === 'local') {
    connectLocalVideo()
  } else if (streamType.value === 'rtmp') {
    connectRTMP()
  }
}

// 关闭WebSocket连接
const closeWebSocket = () => {
  // 清除所有超时计时器
  resetDataTimeout()
  
  if (ws.value) {
    // 移除所有事件监听器
    ws.value.onopen = null
    ws.value.onmessage = null
    ws.value.onerror = null
    ws.value.onclose = null
    
    // 关闭连接
    if (ws.value.readyState === WebSocket.OPEN || 
        ws.value.readyState === WebSocket.CONNECTING) {
      ws.value.close()
    }
    ws.value = null
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  // 清除所有超时计时器
  resetDataTimeout()
  // 关闭WebSocket连接
  closeWebSocket()
})

const selectStream=(s)=>{
  selectedStreamId.value=s.stream_id || s.streamId
  connectSelectedStream()
}
const handleConnect=()=>{
  if(streamType.value==='local'){connectLocalVideo();return}
  if(selectedStreamId.value){connectSelectedStream();return}
  connectRTMP()
}
const handleDisconnect=()=>{
  closeWebSocket()
  isConnected.value=false
  isConnecting.value=false
  addLog('info','已断开连接')
}
const snapshot=()=>{
  if(!imageData.value) return
  const a=document.createElement('a')
  a.href=imageData.value
  a.download=`snapshot_${Date.now()}.jpg`
  a.click()
}
const enterFullscreen=()=>{
  const el=videoBoxRef.value
  if(!el) return
  if(el.requestFullscreen) el.requestFullscreen()
}
const logTypeTag=(t)=>{
  if(t==='error') return 'danger'
  if(t==='open') return 'success'
  if(t==='close') return 'warning'
  return 'info'
}
const formatTime=(d)=>{
  const dt=new Date(d)
  const p=n=>String(n).padStart(2,'0')
  return `${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`
}

const queryStreams=async()=>{
  if(!deviceSnQuery.value){
    // 如果为空，则恢复加载运行中的流
    fetchAllStreams()
    return
  }
  try{
    const res=await request({url:`/api/streams/device_sn`,method:'get',params:{device_sn:deviceSnQuery.value}})
    const list = res.videoStreamList || res.data?.videoStreamList || (Array.isArray(res)?res:[])
    streams.value = list
    if(streams.value.length>0){
      selectedStreamId.value = streams.value[0].stream_id || streams.value[0].streamId
    }
    addLog('info',`查询到 ${streams.value.length} 条流`)
  }catch(e){
    console.error('查询流失败:',e)
    ElMessage.error('查询流失败')
  }
}

const startSelectedStream=async()=>{
  if(!selectedStreamId.value){ElMessage.warning('未选择流');return}
  try{
    await request({url:`/api/streams/${selectPOSTedStreamId.value}/start`,method:'post'})
    ElMessage.success('启动流成功')
    addLog('info','启动流成功')
    setTimeout(fetchAllStreams, 1000)
  }catch(e){
    ElMessage.error('启动失败')
  }
}

const stopSelectedStream=async()=>{
  if(!selectedStreamId.value){ElMessage.warning('未选择流');return}
  try{
    await request({url:`/api/streams/${selectedStreamId.value}/stop`,method:'post'})
    ElMessage.success('停止流成功')
    addLog('info','停止流成功')
    setTimeout(fetchAllStreams, 1000)
  }catch(e){
    ElMessage.error('停止失败')
  }
}
</script>

<style scoped>
.monitor-page {
  height: 100vh;
  background: linear-gradient(180deg, #e8eef3 0%, #f2f6f9 100%);
  padding: 12px;
  box-sizing: border-box;
}
.full {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}
.status-tag {
  transform: translateY(-1px);
}
.controls-area {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ctrl-item {
  min-width: 220px;
}
.action-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.left-panel {
  border-right: 1px solid #ebeef5;
  padding: 12px;
}
.panel-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.device-list {
  height: calc(100% - 28px);
}
.device-item {
  padding: 10px 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all .2s;
}
.device-item:hover {
  border-color: #c0c4cc;
}
.device-item.active {
  border-color: #409EFF;
  background: #ecf5ff;
}
.device-name {
  font-weight: 600;
  color: #303133;
}
.device-meta {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}
.main-panel {
  padding: 12px;
  background: #f6f8fb;
}
.video-card {
  background: #111827;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #1f2937;
}
.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #0b1220;
  border-bottom: 1px solid #1f2937;
  color: #e5e7eb;
}
.video-title {
  font-size: 14px;
}
.video-ops {
  display: flex;
  gap: 8px;
}
.video-body {
  position: relative;
  height: calc(70vh - 80px);
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b1220;
}
.video-stream {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-overlay {
  position: absolute;
  left: 12px;
  bottom: 12px;
}
.kpis {
  display: flex;
  gap: 10px;
}
.kpi {
  min-width: 90px;
  background: rgba(0,0,0,0.55);
  color: #e5e7eb;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.08);
}
.kpi-label {
  font-size: 12px;
  color: #9ca3af;
}
.kpi-value {
  font-size: 16px;
  font-weight: 700;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.info-card {
  height: 220px;
}
.info-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
  font-size: 13px;
}
.info-row:last-child {
  border-bottom: none;
}
.mono {
  font-family: Consolas, Monaco, monospace;
  color: #606266;
}
.log-list {
  height: 160px;
}
.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
}
.log-time {
  color: #909399;
}
</style>
