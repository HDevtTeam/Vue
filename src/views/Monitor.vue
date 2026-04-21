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
            <el-radio-button label="raw">原始流</el-radio-button>
            <el-radio-button label="analyze">分析流</el-radio-button>
          </el-radio-group>
          <el-input v-model="deviceSnQuery" placeholder="输入设备SN查询流" class="ctrl-item" @keyup.enter="queryStreams">
            <template #append>
              <el-button @click="queryStreams">查询</el-button>
            </template>
          </el-input>
          <el-input v-if="streamType==='analyze'" v-model="targetType" placeholder="输入要检测的物体" class="ctrl-item" @keyup.enter="handleConnect">
            <template #append>
              <el-button @click="handleConnect" :loading="isConnecting">检测</el-button>
            </template>
          </el-input>
          <el-input v-model="rtmpUrl" placeholder="RTMP 地址" class="ctrl-item" @keyup.enter="handleConnect">
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
              
              <!-- WebRTC 视频（v-if 开头） -->
              <video 
                v-if="isWebRTCConnected" 
                ref="videoElementRef" 
                autoplay 
                playsinline 
                class="video-stream"
              ></video>
              
              <!-- 传统 WebSocket 图片渲染 -->
              <img v-else-if="imageData" :src="imageData" class="video-stream" />
              
              <!-- 连接中状态 -->
              <div v-else-if="!isConnected && isConnecting" class="video-placeholder">
                <el-empty :description="getLoadingText()" />
              </div>
              
              <!-- 未连接状态（v-else） -->
              <div v-else class="video-placeholder">
                <el-empty description="未连接" />
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
const targetType=ref('')

const fetchAllStreams=async()=>{
  try{
    addLog('info','正在同步活跃的RTMP流...')
    // 直接使用axios请求，避免baseURL的影响
    const res=await axios.get('http://118.145.239.110:5439/rtmp/streams', { timeout: 10000 })
    
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
  //connectLocalVideo()
})

const ws = ref(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const imageData = ref(null)
const streamData = ref(null)
const streamType = ref('raw')
const rtmpUrl = ref('')
const videoBoxRef=ref(null)
const connectionStatus=computed(()=>isConnecting.value?'连接中':(isConnected.value?'在线':'离线'))
const statusTagType=computed(()=>isConnecting.value?'warning':(isConnected.value?'success':'danger'))
// WebRTC 相关变量
const remoteStream = ref(null)           // 存储 WebRTC 接收的 MediaStream
const isWebRTCConnected = ref(false)     // 控制 video 元素显示
const videoElementRef = ref(null)        // video 元素引用
let pc = null
let localStream = null


// 获取加载文本
const getLoadingText = () => {
  if (streamType.value === 'analyze') {
    return '正在连接RTMP流...'
  }
  return '正在连接原始视频流...'
}

// 获取来源文本
const getSourceText = () => {
  if (!streamData.value) return ''
  
  if (streamType.value === 'raw') {
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
  ElMessage.error(`${streamType.value === 'raw' ? '原始视频' : 'analyze'}流连接错误`)
  console.error('WebSocket错误:', error)
  addLog('error','连接错误')
}

// 处理WebSocket关闭
const handleWebSocketClose = (sourceName, event) => {
  isConnected.value = false
  isConnecting.value = false
  
  if (event && event.code === 1008) {
    ElMessage.error(`${sourceName}连接失败: ${event.reason}`)
  } else if (streamType.value === 'raw' && sourceName === '本地视频流' || 
            (streamType.value === 'analyze' && sourceName === 'RTMP分析流')) {
    ElMessage.warning(`${sourceName}连接已关闭`)
  }
  addLog('close',`${sourceName}关闭`)
}

// 连接原始视频WebSocket
/*const connectLocalVideo = () => {
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
}*/

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

  // 保存RTMP URL以便在connectWebRTC和connectTraditionalWebSocket中使用
  rtmpUrl.value = url
  
  // 优先尝试WebRTC连接
  if (window.RTCPeerConnection) {
    connectWebRTC()
  } else {
    // 不支持WebRTC，使用传统WebSocket
    connectTraditionalWebSocket()
  }
}



// 监听 remoteStream 和 video 元素，自动绑定
watch(
  [remoteStream, videoElementRef],
  ([stream, videoEl]) => {
    if (stream && videoEl) {
      videoEl.srcObject = stream;
      // 确保自动播放
      videoEl.play().catch(e => console.warn('自动播放失败:', e));
    }
  },
  { immediate: true }
);


// 连接RTMP流
const connectRTMP = () => {
  closeWebSocket()
  isConnecting.value = true
  imageData.value = null
  streamData.value = null
  
  // 优先尝试WebRTC连接
  if (window.RTCPeerConnection) {
    connectWebRTC()
  } else {
    // 不支持WebRTC，使用传统WebSocket
    connectTraditionalWebSocket()
  }
}

// 使用传统WebSocket连接
const connectTraditionalWebSocket = () => {
  let wsUrl=null;
  if(streamType.value=='analyze')
    wsUrl = 'ws://118.145.239.110:5439/ws/rtmp';
  else
    wsUrl = 'ws://118.145.239.110:5439/ws/rtmp/raw';
    
  const params = [];
  
  // 修复RTMP流地址格式，确保有双斜杠
  let fixedRtmpUrl = rtmpUrl.value.trim();
  if (fixedRtmpUrl && !fixedRtmpUrl.includes('//live/')) {
    fixedRtmpUrl = fixedRtmpUrl.replace(/\/live\//, '//live/');
  }
  
  // 如果提供了URL，则添加为查询参数
  if (fixedRtmpUrl) {
    const encodedUrl = encodeURIComponent(fixedRtmpUrl)
    params.push(`rtmp_url=${encodedUrl}`);
  }
  
  // 如果提供了目标类型，则添加为查询参数
  if (targetType.value.trim()) {
    const encodedTargetType = encodeURIComponent(targetType.value.trim())
    params.push(`target_type=${encodedTargetType}`);
  }
  
  // 将所有参数添加到URL
  if (params.length > 0) {
    wsUrl = `${wsUrl}?${params.join('&')}`;
  }
  
  // 重置WebRTC相关状态
  closePeerConnection()
  
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
      ElMessage.success('RTMP流连接成功（传统WebSocket）')
      addLog('open','RTMP已连接（传统WebSocket）')
      
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

// 使用WebRTC连接
const connectWebRTC = () => {
  let wsUrl=null;
  if(streamType.value=='analyze')
    wsUrl = 'ws://118.145.239.110:5439/ws/rtmp';
  else
    wsUrl = 'ws://118.145.239.110:5439/ws/rtmp/raw';
    
  const params = [];
  
  // 修复RTMP流地址格式，确保有双斜杠
  let fixedRtmpUrl = rtmpUrl.value.trim();
  if (fixedRtmpUrl && !fixedRtmpUrl.includes('//live/')) {
    fixedRtmpUrl = fixedRtmpUrl.replace(/\/live\//, '//live/');
  }
  
  // 如果提供了URL，则添加为查询参数
  if (fixedRtmpUrl) {
    const encodedUrl = encodeURIComponent(fixedRtmpUrl)
    params.push(`rtmp_url=${encodedUrl}`);
  }
  
  // 如果提供了目标类型，则添加为查询参数
  if (targetType.value.trim()) {
    const encodedTargetType = encodeURIComponent(targetType.value.trim())
    params.push(`target_type=${encodedTargetType}`);
  }
  
  // 将所有参数添加到URL
  if (params.length > 0) {
    wsUrl = `${wsUrl}?${params.join('&')}`;
  }
  
  // 设置连接超时
  const connectionTimeout = setTimeout(() => {
    if (ws.value && ws.value.readyState !== WebSocket.OPEN) {
      ElMessage.error('WebRTC连接超时，请检查流地址是否正确')
      closeWebSocket()
      isConnecting.value = false
      // 回退到传统WebSocket
      connectTraditionalWebSocket()
    }
  }, 10000) // 10秒超时
  
  try {
    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      clearTimeout(connectionTimeout)
      isConnecting.value = true
      addLog('open','WebRTC连接已建立，正在协商...')
      
      // 创建PeerConnection
      createPeerConnection()
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.answer) {
          // 处理服务器返回的answer
          handleAnswer(data.answer)
        } else if (data.candidate) {
          // 处理ICE候选
          handleCandidate(data.candidate)
        } else {
          // 处理传统WebSocket消息
          resetDataTimeout()
          handleWebSocketMessage(event)
        }
      } catch (error) {
        // 处理传统WebSocket消息
        resetDataTimeout()
        handleWebSocketMessage(event)
      }
    }
    
    ws.value.onerror = (error) => {
      clearTimeout(connectionTimeout)
      handleWebSocketError(error)
      // 回退到传统WebSocket
      connectTraditionalWebSocket()
    }
    
    ws.value.onclose = (event) => {
      clearTimeout(connectionTimeout)
      closePeerConnection()
      handleWebSocketClose('WebRTC流', event)
      // 如果连接关闭且不是用户主动断开，尝试回退到传统WebSocket
      if (!event.wasClean) {
        connectTraditionalWebSocket()
      }
    }
  } catch (error) {
    clearTimeout(connectionTimeout)
    ElMessage.error(`WebRTC连接失败: ${error.message}`)
    isConnecting.value = false
    console.error('WebSocket创建错误:', error)
    addLog('error','WebRTC连接失败')
    // 回退到传统WebSocket
    connectTraditionalWebSocket()
  }
}

// 创建PeerConnection
const createPeerConnection = () => {
  try {
    pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    })

    // 监听ICE候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.value.send(JSON.stringify({ candidate: event.candidate }))
      }
    }

    // 监听远程轨道
    pc.ontrack = (event) => {
      console.log('收到远程轨道:', event.tracks.length, 'tracks')
      if (event.tracks.length > 0) {
        // 保存远程流
        remoteStream.value = event.streams[0];
        isWebRTCConnected.value = true;
        
        // 连接状态更新
        if (isConnecting.value) {
          isConnecting.value = false;
          isConnected.value = true;
          ElMessage.success('WebRTC视频流连接成功');
          addLog('open', 'WebRTC视频流连接成功');
        }
      }
    }

    // 监听连接状态变化
    pc.onconnectionstatechange = () => {
      console.log('WebRTC连接状态:', pc.connectionState)
      if (pc.connectionState === 'connected') {
        isConnected.value = true
        isConnecting.value = false
        ElMessage.success('WebRTC连接成功')
        addLog('open','WebRTC连接成功')
        startDataTimeout()
      } else if (pc.connectionState === 'failed') {
        ElMessage.error('WebRTC连接失败')
        addLog('error','WebRTC连接失败')
        closePeerConnection()
        // 回退到传统WebSocket
        connectTraditionalWebSocket()
      }
    }

    // 创建offer
    pc.createOffer().then((offer) => {
      return pc.setLocalDescription(offer)
    }).then(() => {
      // 发送offer给服务器
      ws.value.send(JSON.stringify({ offer: {
        type: pc.localDescription.type,
        sdp: pc.localDescription.sdp
      }}))
    }).catch((error) => {
      console.error('创建offer失败:', error)
      ElMessage.error('WebRTC协商失败')
      closePeerConnection()
      // 回退到传统WebSocket
      connectTraditionalWebSocket()
    })
  } catch (error) {
    console.error('创建PeerConnection失败:', error)
    ElMessage.error('WebRTC初始化失败')
    closePeerConnection()
    // 回退到传统WebSocket
    connectTraditionalWebSocket()
  }
}

// 处理服务器返回的answer
const handleAnswer = (answer) => {
  if (pc) {
    pc.setRemoteDescription(new RTCSessionDescription(answer)).catch((error) => {
      console.error('设置远程描述失败:', error)
      ElMessage.error('WebRTC协商失败')
      closePeerConnection()
      // 回退到传统WebSocket
      connectTraditionalWebSocket()
    })
  }
}

// 处理ICE候选
const handleCandidate = (candidate) => {
  if (pc && candidate) {
    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => {
      console.error('添加ICE候选失败:', error)
    })
  }
}

// 关闭PeerConnection
const closePeerConnection = () => {
  if (pc) {
    pc.close();
    pc = null;
  }
  
  // 停止所有 tracks
  if (remoteStream.value) {
    remoteStream.value.getTracks().forEach(track => track.stop());
    remoteStream.value = null;
  }
  
  // 重置状态
  isWebRTCConnected.value = false;
  
  // 清除本地流（如果存在）
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // 传统图像数据也清空
  imageData.value = null;
  streamData.value = null;
  
  // 不再需要手动操作 DOM，Vue 会自动更新视图
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
  
  closeWebSocket()
  // 根据类型连接不同的流
  if (type === 'raw') {
    //connectLocalVideo()
    streamType.value='raw'
  } else if (type === 'analyze') {
    //if(selectedStreamId.value){connectSelectedStream()}else{connectRTMP()}
    streamType.value='analyze'
  }
}

// 重试当前连接
const retryConnection = () => {
  /*if (streamType.value === 'local') {
    connectLocalVideo()
  } else if (streamType.value === 'rtmp') {
    connectRTMP()
  }*/
  connectRTMP()
}

// 关闭WebSocket连接
const closeWebSocket = () => {
  // 清除所有超时计时器
  resetDataTimeout()
  
  // 关闭PeerConnection
  closePeerConnection()
  
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
  //if(streamType.value==='local'){connectLocalVideo();return}
  if(rtmpUrl.value.trim()){
    connectRTMP()
    selectedStreamId.value=null
  }
  if(selectedStreamId.value){connectSelectedStream();return}
  
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
  background: #f0f2f5;
  padding: 8px;
  box-sizing: border-box;
}
.full {
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  background: #fff;
  box-shadow: none;
  border: 1px solid #dcdfe6;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 2px solid #1890ff;
  background: #fafafa;
}
.title-area {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;
}
.title {
  font-size: 16px;
  font-weight: 700;
  color: #1f2329;
  font-family: 'Microsoft YaHei', sans-serif;
}
.status-tag {
  transform: translateY(-1px);
}
.controls-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  margin: 0 20px;
  min-width: 0;
}
.ctrl-item {
  min-width: 150px;
  max-width: 250px;
  flex: 1;
}
.action-area {
  display: flex;
  align-items: center;
  gap: 6px;
}
.left-panel {
  border-right: 1px solid #dcdfe6;
  padding: 10px;
  background: #fafafa;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
}
.device-list {
  height: calc(100% - 32px);
}
.device-item {
  padding: 8px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 0;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all .2s;
  background: #fff;
}
.device-item:hover {
  border-color: #1890ff;
  background: #ecf5ff;
}
.device-item.active {
  border-color: #1890ff;
  background: #ecf5ff;
  border-left: 4px solid #1890ff;
}
.device-name {
  font-weight: 600;
  color: #1f2329;
  font-size: 13px;
}
.device-meta {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.main-panel {
  padding: 10px;
  background: #fafafa;
}
.video-card {
  background: #000;
  border-radius: 0;
  overflow: hidden;
  border: 1px solid #333;
}
.video-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
  color: #e5e7eb;
}
.video-title {
  font-size: 13px;
  font-weight: 600;
}
.video-ops {
  display: flex;
  gap: 6px;
}
.video-body {
  position: relative;
  height: calc(70vh - 60px);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
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
  left: 8px;
  bottom: 8px;
}
.kpis {
  display: flex;
  gap: 8px;
}
.kpi {
  min-width: 80px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 6px 8px;
  border-radius: 0;
  border: 1px solid rgba(255,255,255,0.1);
}
.kpi-label {
  font-size: 11px;
  color: #ccc;
}
.kpi-value {
  font-size: 14px;
  font-weight: 700;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}
.info-card {
  height: 200px;
  border-radius: 0;
  border: 1px solid #dcdfe6;
  box-shadow: none;
}
.info-title {
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
  color: #303133;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}
.info-row:last-child {
  border-bottom: none;
}
.mono {
  font-family: Consolas, Monaco, monospace;
  color: #606266;
  font-size: 11px;
}
.log-list {
  height: 150px;
}
.log-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 11px;
  border-bottom: 1px solid #f0f0f0;
}
.log-item:last-child {
  border-bottom: none;
}
.log-time {
  color: #909399;
  font-size: 10px;
  min-width: 60px;
}
</style>
