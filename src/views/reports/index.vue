<template>
  <div class="reports-container">
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
          />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="filters.areaId" placeholder="全部区域" clearable style="width: 150px">
            <el-option label="全部区域" value="" />
            <el-option label="区域1" :value="1" />
            <el-option label="区域2" :value="2" />
            <el-option label="区域3" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型">
          <el-select v-model="filters.eventTypes" multiple placeholder="全部" style="width: 200px">
            <el-option label="气体泄漏" value="gas_leak" />
            <el-option label="火灾" value="fire" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间粒度">
          <el-select v-model="filters.timeGranularity" style="width: 120px">
            <el-option label="小时" value="hour" />
            <el-option label="天" value="day" />
            <el-option label="周" value="week" />
            <el-option label="月" value="month" />
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

    <el-card class="chart-card" v-loading="mainChartLoading">
      <div class="chart-header">
        <h3>污染检测趋势</h3>
        <div class="meta-info" v-if="mainMeta">
          <span>总事件数：{{ mainMeta.totalEvents ?? '-' }}</span>
          <span>时间范围：{{ mainMeta.timeRange ?? '-' }}</span>
        </div>
      </div>
      <div ref="mainChart" style="height: 300px; width: 100%"></div>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card" v-loading="typeChartLoading">
          <h3>污染类型分布</h3>
          <div class="meta-info" v-if="typeMeta">
            <span>类型数量：{{ typeMeta.totalTypes ?? '-' }}</span>
            <span>最多类型：{{ typeMeta.mostFrequentType ?? '-' }}</span>
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMainChartData, getTypeDistributionData, createExportTask, downloadFile, getTaskStatus } from '@/api/report'

const filters = ref({
  areaId: '',
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

// 构建请求体，API 要求至少传 {}
const buildMainParams = () => {
  const p = {
    timeGranularity: filters.value.timeGranularity,
    chartType: filters.value.chartType
  }
  if (timeRange.value?.length === 2) {
    p.startTime = timeRange.value[0]
    p.endTime = timeRange.value[1]
  }
  if (filters.value.areaId !== '' && filters.value.areaId != null) p.areaId = filters.value.areaId
  if (filters.value.eventTypes?.length) p.eventTypes = filters.value.eventTypes
  return Object.keys(p).length ? p : {}
}

const buildTypeParams = () => {
  const p = { timeGranularity: filters.value.timeGranularity }
  if (timeRange.value?.length === 2) {
    p.startTime = timeRange.value[0]
    p.endTime = timeRange.value[1]
  }
  if (filters.value.areaId !== '' && filters.value.areaId != null) p.areaId = filters.value.areaId
  return Object.keys(p).length ? p : {}
}

const buildExportParams = (format) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  const defaultRange = [
    start.toISOString().split('T')[0] + 'T00:00:00',
    end.toISOString().split('T')[0] + 'T23:59:59'
  ]
  const [startTime, endTime] = timeRange.value?.length === 2 ? timeRange.value : defaultRange
  const p = {
    startTime,
    endTime,
    exportFormat: format,
    fileName: `报表_${new Date().toISOString().slice(0, 10)}.${format === 'excel' ? 'xlsx' : 'pdf'}`
  }
  if (filters.value.areaId !== '' && filters.value.areaId != null) p.areaId = filters.value.areaId
  if (filters.value.eventTypes?.length) p.eventTypes = filters.value.eventTypes
  return p
}

const fetchMainChart = async () => {
  mainChartLoading.value = true
  try {
    const res = await getMainChartData(buildMainParams())
    const data = res.chartData ?? res
    const meta = res.metaData ?? res.meta
    const chartType = res.chartType ?? filters.value.chartType

    mainMeta.value = meta
    mainChartLoading.value = false
    await nextTick()
    renderMainChart(normalizeChartData(data), chartType)
  } catch (error) {
    console.error('获取主图表失败:', error)
    ElMessage.error('获取数据失败')
    mainMeta.value = null
  } finally {
    mainChartLoading.value = false
  }
}

// 适配多种 chartData 结构
const normalizeChartData = (data) => {
  if (!data) return { labels: [], datasets: [{ label: '', data: [] }] }
  if (data.labels && data.datasets) return data
  if (data.xAxisData && data.series) {
    return {
      labels: data.xAxisData,
      datasets: data.series.map((s, i) => ({
        label: s.name || `系列${i + 1}`,
        data: s.data || []
      }))
    }
  }
  if (Array.isArray(data) && data.length) {
    const labels = data.map(d => d.name ?? d.label ?? d.x ?? '')
    const values = data.map(d => d.value ?? d.data ?? d.y ?? 0)
    return { labels, datasets: [{ label: '', data: values }] }
  }
  return { labels: [], datasets: [{ label: '', data: [] }] }
}

const renderMainChart = (chartData, chartType) => {
  if (!mainChart.value) return
  const chart = echarts.init(mainChart.value)
  const labels = chartData.labels || []
  const datasets = chartData.datasets || []

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: datasets.map(d => d.label).filter(Boolean) },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value' },
    series: datasets.map(d => ({
      name: d.label,
      type: chartType === 'line' ? 'line' : 'bar',
      data: d.data || [],
      smooth: chartType === 'line'
    }))
  }
  chart.setOption(option, true)
}

const fetchTypeChart = async () => {
  typeChartLoading.value = true
  try {
    const res = await getTypeDistributionData(buildTypeParams())
    const data = res.chartData ?? res
    const meta = res.metaData ?? res.meta

    typeMeta.value = meta
    const normalized = normalizeChartData(data)
    typeChartLoading.value = false
    await nextTick()
    renderPieChart(typeChart.value, normalized, '污染类型分布')

    // 污染等级统计：无单独接口，用类型分布或占位
    if (normalized.labels?.length && normalized.datasets?.[0]?.data?.length) {
      renderPieChart(levelChart.value, normalized, '污染等级统计')
    } else {
      renderPieChart(levelChart.value, {
        labels: ['严重', '中度', '轻度'],
        datasets: [{ data: [0, 0, 0] }]
      }, '污染等级统计')
    }
  } catch (error) {
    console.error('获取副图表失败:', error)
    typeMeta.value = null
  } finally {
    typeChartLoading.value = false
  }
}

const renderPieChart = (dom, chartData, title) => {
  if (!dom) return
  const chart = echarts.init(dom)
  const labels = chartData.labels || []
  const dataArr = chartData.datasets?.[0]?.data || chartData.datasets?.[0] || []

  const pieData = labels.map((label, i) => ({
    name: label,
    value: Array.isArray(dataArr) ? dataArr[i] ?? 0 : dataArr
  }))

  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: pieData.length ? pieData : [{ name: '暂无数据', value: 0 }],
      emphasis: { itemStyle: { shadowBlur: 10 } }
    }]
  }
  chart.setOption(option, true)
}

const handleExport = async (format) => {
  exportLoading.value = true
  try {
    const params = buildExportParams(format)
    const taskRes = await createExportTask(params)
    const taskId = taskRes.taskId ?? taskRes.data?.taskId

    if (!taskId) {
      ElMessage.error('创建导出任务失败')
      exportLoading.value = false
      return
    }

    ElMessage.info('导出任务已创建，正在处理...')

    const poll = async () => {
      try {
        const statusRes = await getTaskStatus(taskId)
        if (statusRes.status === 'success') {
          const fileName = statusRes.fileName || `report.${format === 'excel' ? 'xlsx' : 'pdf'}`
          const blob = await downloadFile(fileName)
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          link.click()
          window.URL.revokeObjectURL(url)
          ElMessage.success('导出成功')
          exportLoading.value = false
        } else if (statusRes.status === 'failed') {
          ElMessage.error(`导出失败：${statusRes.errorMessage || '未知错误'}`)
          exportLoading.value = false
        } else {
          setTimeout(poll, 2000)
        }
      } catch (e) {
        ElMessage.error('导出失败')
        exportLoading.value = false
      }
    }
    poll()
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
    exportLoading.value = false
  }
}

const handleSearch = () => {
  fetchMainChart()
  fetchTypeChart()
}

const resetFilters = () => {
  filters.value = {
    areaId: '',
    eventTypes: [],
    chartType: 'line',
    timeGranularity: 'day'
  }
  timeRange.value = []
  handleSearch()
}

watch(() => filters.value.chartType, () => {
  if (mainMeta.value || mainChartLoading.value) fetchMainChart()
})

onMounted(() => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  timeRange.value = [
    start.toISOString().split('T')[0] + 'T00:00:00',
    end.toISOString().split('T')[0] + 'T23:59:59'
  ]
  handleSearch()
})

window.addEventListener('resize', () => {
  echarts.getInstanceByDom(mainChart.value)?.resize()
  echarts.getInstanceByDom(typeChart.value)?.resize()
  echarts.getInstanceByDom(levelChart.value)?.resize()
})
</script>

<style scoped>
.reports-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h1 { margin: 0; font-size: 24px; }
.filter-card { margin-bottom: 20px; }
.chart-card { margin-bottom: 20px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.chart-header h3 { margin: 0; }
.meta-info { display: flex; gap: 20px; color: #666; font-size: 14px; }
</style>
