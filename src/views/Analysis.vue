<template>
  <div class="reports-container">
    <!-- 头部 + 导出 -->
    <div class="header">
      <h1>统计分析</h1>
      <el-dropdown @command="handleExport">
        <el-button type="primary" :loading="exportLoading">
          导出报表 <el-icon><Download /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="excel">导出 Excel</el-dropdown-item>
            <el-dropdown-item command="pdf">导出 PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DDTHH:mm:ss"
            :default-value="[new Date(Date.now() - 30*24*60*60*1000), new Date()]"
          />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="filters.areaId" placeholder="请选择区域" style="width: 150px">
            <el-option label="全部区域" :value="null" />
            <el-option label="华北区域" :value="1" />
            <el-option label="华东区域" :value="2" />
            <el-option label="华南区域" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select v-model="filters.eventTypes" multiple placeholder="全部" style="width: 200px">
            <el-option label="塑料" value="plastic" />
            <el-option label="玻璃" value="glass" />
            <el-option label="金属" value="metal" />
          </el-select>
        </el-form-item>
        <el-form-item label="图表类型">
          <el-radio-group v-model="filters.chartType">
            <el-radio-button value="line">折线图</el-radio-button>
            <el-radio-button value="bar">柱状图</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">应用</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 主图表 -->
    <el-card class="chart-card" v-loading="mainChartLoading">
      <div class="chart-header">
        <h3>污染检测趋势</h3>
        <div class="meta-info" v-if="mainMeta">
          <span>总事件数：{{ mainMeta.totalEvents }}</span>
          <span>时间范围：{{ mainMeta.timeRange }}</span>
        </div>
      </div>
      <div ref="mainChart" style="height: 300px; width: 100%"></div>
    </el-card>

    <!-- 副图表（饼图） -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card" v-loading="typeChartLoading">
          <h3>污染类型分布</h3>
          <div class="meta-info" v-if="typeMeta">
            <span>类型数量：{{ typeMeta.totalTypes }}</span>
            <span>最多类型：{{ typeMeta.mostFrequentType }}</span>
          </div>
          <div ref="typeChart" style="height: 300px; width: 100%"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" v-loading="typeChartLoading">
          <h3>污染等级统计</h3>
          <div ref="levelChart" style="height: 300px; width: 100%"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMainChartData, getTypeDistributionData, createExportTask, downloadFile, getTaskStatus } from '@/api/report'

// ==================== 状态 ====================
const filters = ref({
  areaId: null,
  eventTypes: [],
  chartType: 'line',
  timeGranularity: 'day'
})

const timeRange = ref([])

const mainChartLoading = ref(false)
const typeChartLoading = ref(false)
const exportLoading = ref(false)

const mainChart = ref(null)
const typeChart = ref(null)
const levelChart = ref(null)

const mainMeta = ref(null)
const typeMeta = ref(null)

// ==================== 获取主图表数据 ====================
const fetchMainChart = async () => {
  if (!filters.value.areaId) {
    ElMessage.warning('请选择区域')
    return
  }

  mainChartLoading.value = true
  try {
    const params = {
      areaId: filters.value.areaId,
      chartType: filters.value.chartType,
      timeGranularity: filters.value.timeGranularity
    }

    if (timeRange.value && timeRange.value.length === 2) {
      params.startTime = timeRange.value[0]
      params.endTime = timeRange.value[1]
    }

    if (filters.value.eventTypes.length > 0) {
      params.eventTypes = filters.value.eventTypes
    }

    const res = await getMainChartData(params)
    
    // 保存元数据
    mainMeta.value = res.metaData
    
    // 渲染图表
    renderMainChart(res.chartData, res.chartType)
    
  } catch (error) {
    console.error('获取主图表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    mainChartLoading.value = false
  }
}

// 渲染主图表
const renderMainChart = (chartData, chartType) => {
  const chart = echarts.init(mainChart.value)
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: chartData.datasets.map(d => d.label) },
    xAxis: { type: 'category', data: chartData.labels },
    yAxis: { type: 'value' },
    series: chartData.datasets.map(d => ({
      name: d.label,
      type: chartType === 'line' ? 'line' : 'bar',
      data: d.data,
      smooth: true,
      areaStyle: chartType === 'line' ? {} : undefined,
      itemStyle: {
        color: d.backgroundColor || undefined,
        borderColor: d.borderColor,
        borderWidth: d.borderWidth
      }
    }))
  }
  
  chart.setOption(option)
}

// ==================== 获取副图表数据 ====================
const fetchTypeChart = async () => {
  if (!filters.value.areaId) return

  typeChartLoading.value = true
  try {
    const params = {
      areaId: filters.value.areaId,
      timeGranularity: filters.value.timeGranularity
    }

    if (timeRange.value && timeRange.value.length === 2) {
      params.startTime = timeRange.value[0]
      params.endTime = timeRange.value[1]
    }

    const res = await getTypeDistributionData(params)
    
    // 保存元数据
    typeMeta.value = res.metaData
    
    // 渲染饼图
    renderPieChart(typeChart.value, res.chartData, '污染类型分布')
    
    // 这里第二个饼图可能需要另一个接口，先用模拟数据
    renderPieChart(levelChart.value, {
      labels: ['严重', '中度', '轻度'],
      datasets: [{
        data: [20, 50, 30],
        backgroundColor: ['#ff4d4f', '#faad14', '#52c41a']
      }]
    }, '污染等级统计')
    
  } catch (error) {
    console.error('获取副图表失败:', error)
  } finally {
    typeChartLoading.value = false
  }
}

// 渲染饼图
const renderPieChart = (dom, chartData, title) => {
  const chart = echarts.init(dom)
  
  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: chartData.labels.map((label, index) => ({
        name: label,
        value: chartData.datasets[0].data[index]
      })),
      itemStyle: {
        color: (params) => chartData.datasets[0]?.backgroundColor?.[params.dataIndex]
      },
      emphasis: { itemStyle: { shadowBlur: 10 } }
    }]
  }
  
  chart.setOption(option)
}

// ==================== 导出 ====================
const handleExport = async (format) => {
  if (!filters.value.areaId) {
    ElMessage.warning('请选择区域')
    return
  }

  exportLoading.value = true
  try {
    const params = {
      areaId: filters.value.areaId,
      exportFormat: format,
      fileName: `报表_${new Date().toISOString().slice(0,10)}`
    }

    if (timeRange.value && timeRange.value.length === 2) {
      params.startTime = timeRange.value[0]
      params.endTime = timeRange.value[1]
    }

    if (filters.value.eventTypes.length > 0) {
      params.eventTypes = filters.value.eventTypes
    }

    // 创建导出任务
    const taskRes = await createExportTask(params)
    
    ElMessage.info('导出任务已创建，正在处理...')
    
    // 轮询任务状态
    const checkStatus = setInterval(async () => {
      const statusRes = await getTaskStatus(taskRes.taskId)
      
      if (statusRes.status === 'success') {
        clearInterval(checkStatus)
        
        // 下载文件
        const blob = await downloadFile(statusRes.fileName)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = statusRes.fileName
        link.click()
        
        ElMessage.success('导出成功')
        exportLoading.value = false
        
      } else if (statusRes.status === 'failed') {
        clearInterval(checkStatus)
        ElMessage.error(`导出失败：${statusRes.errorMessage}`)
        exportLoading.value = false
      }
      // waiting/processing 继续轮询
    }, 2000)
    
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
    exportLoading.value = false
  }
}

// ==================== 筛选 ====================
const handleSearch = () => {
  fetchMainChart()
  fetchTypeChart()
}

const resetFilters = () => {
  filters.value = {
    areaId: null,
    eventTypes: [],
    chartType: 'line',
    timeGranularity: 'day'
  }
  timeRange.value = []
  handleSearch()
}

// 监听图表类型变化
watch(() => filters.value.chartType, () => {
  if (mainMeta.value) {
    fetchMainChart()
  }
})

// ==================== 初始化 ====================
onMounted(() => {
  // 默认选中最近30天
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  timeRange.value = [
    start.toISOString().split('T')[0] + 'T00:00:00',
    end.toISOString().split('T')[0] + 'T23:59:59'
  ]
  
  // 默认选中一个区域
  filters.value.areaId = 1
  
  handleSearch()
})

// 窗口大小变化时自适应
window.addEventListener('resize', () => {
  echarts.getInstanceByDom(mainChart.value)?.resize()
  echarts.getInstanceByDom(typeChart.value)?.resize()
  echarts.getInstanceByDom(levelChart.value)?.resize()
})
</script>

<style scoped>
.reports-container {
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

.filter-card {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-header h3 {
  margin: 0;
}

.meta-info {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}
</style>