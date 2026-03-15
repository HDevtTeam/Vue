

import request from '@/utils/request'

// 1. 获取主图表数据（折线图/柱状图）
export const getMainChartData = (data) => {
  return request({
    url: '/chart/main',
    method: 'post',
    data
  })
}

// 2. 获取副图表数据（饼图/环形图）
export const getTypeDistributionData = (data) => {
  return request({
    url: '/chart/type-distribution',
    method: 'post',
    data
  })
}

// 3. 创建报表导出任务
export const createExportTask = (data) => {
  return request({
    url: '/chart/export/task',
    method: 'post',
    data
  })
}

// 4. 下载导出文件
export const downloadFile = (fileName) => {
  return request({
    url: `/chart/download/${fileName}`,
    method: 'get',
    responseType: 'blob'  // 文件流
  })
}

// 5. 查询导出任务状态
export const getTaskStatus = (taskId) => {
  return request({
    url: `/chart/export/task/${taskId}/status`,
    method: 'get'
  })
}