
<template>
  <div class="p-6">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">设备管理</h1>
      <el-button type="primary" @click="handleAdd">
        新增设备
      </el-button>
    </div>

    <el-card>
      <el-table :data="deviceList" border stripe>
        <el-table-column prop="id" label="设备编号" width="180" />
        <el-table-column prop="name" label="设备名称" width="200" />
        <el-table-column prop="model" label="设备型号" width="150" />
        
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'info'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="rtmp" label="RTMP地址" min-width="300" show-overflow-tooltip />
        <!-- 在 RTMP地址 列后面加上这两列 -->
        <el-table-column prop="organization" label="所属组织" width="150" />
        <el-table-column prop="owner" label="归属人" width="120" />
        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link @click="handleConfig(row)">RTMP配置</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
             <el-button type="info" link @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
// ✅ 手动导入所有用到的 Element Plus 组件
import { 
  ElTable, 
  ElTableColumn, 
  ElCard, 
  ElButton, 
  ElTag, 
  ElMessage, 
  ElMessageBox 
} from 'element-plus'

// ✅ 导入对应的 CSS（必须！）
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter() 
// 模拟数据
const deviceList = ref([
  {
    id: 'DEV001',
    name: '无人机-01',
    model: 'DJI Mavic 3',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/001',
    organization: '北京项目部',  // 新增
  owner: '张三'                // 新增
  },
  {
    id: 'DEV002',
    name: '无人机-02',
    model: 'DJI Air 2S',
    status: '离线',
    rtmp: 'rtmp://live.example.com/stream/002',
    organization: '北京项目部',  // 新增
    owner: '张三'                // 新增
  },
  {
    id: 'DEV003',
    name: '无人机-03',
    model: 'Autel EVO II',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/003',
        organization: '北京项目部',  // 新增
    owner: '张三'                // 新增
  },
  {
    id: 'DEV004',
    name: '无人机-04',
    model: 'DJI Mini 3 Pro',
    status: '维护',
    rtmp: 'rtmp://live.example.com/stream/004',
        organization: '北京项目部',  // 新增
    owner: '张三'                // 新增
  },
  {
    id: 'DEV005',
    name: '无人机-05',
    model: 'Hubsan Zino Pro',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/005',
        organization: '北京项目部',  // 新增
    owner: '张三'                // 新增
  }
])

// 按钮事件
const handleAdd = () => {
  ElMessage.info('新增功能开发中')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑设备：${row.name}`)
}

const handleConfig = (row) => {
  ElMessage.info(`配置RTMP地址：${row.name}`)
}

const handleDetail = (row) => {
  router.push(`/liling/detail/${row.id}`)  // 跳转到详情页
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除设备【${row.name}】吗？`,
    '删除确认',
    {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    }
  ).then(() => {
    const index = deviceList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      deviceList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}
</script>
