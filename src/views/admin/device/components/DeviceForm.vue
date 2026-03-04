<template>
  <el-dialog v-model="visible" :title="title" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备型号" prop="model">
        <el-input v-model="form.model" placeholder="请输入设备型号" />
      </el-form-item>
      <el-form-item label="所属组织" prop="orgId">
        <el-tree-select
          v-model="form.orgId"
          :data="orgTree"
          :props="{ label: 'name', children: 'children', value: 'id' }"
          placeholder="请选择组织"
          check-strictly
          clearable
        />
      </el-form-item>
      <el-form-item label="归属人" prop="ownerId">
        <el-select v-model="form.ownerId" placeholder="请选择归属人" clearable>
          <el-option v-for="user in userList" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="在线" value="在线" />
          <el-option label="离线" value="离线" />
          <el-option label="维护" value="维护" />
        </el-select>
      </el-form-item>
      <el-form-item label="RTMP地址" prop="rtmp">
        <el-input v-model="form.rtmp" placeholder="rtmp://..." />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// ==================== 模拟数据 ====================
const MOCK_ORG_TREE = [
  {
    id: 1,
    name: '总部',
    children: [
      { id: 2, name: '华北分部', children: [
        { id: 3, name: '北京项目部' },
        { id: 4, name: '天津项目部' }
      ]}
    ]
  }
]

const MOCK_USERS = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' }
]

// ==================== 状态变量 ====================
const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const title = ref('新增设备')

const orgTree = ref(MOCK_ORG_TREE)
const userList = ref(MOCK_USERS)

const form = reactive({
  id: null,
  name: '',
  model: '',
  orgId: null,
  ownerId: null,
  status: '在线',
  rtmp: ''
})

const rules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }]
}

// ==================== 打开弹窗 ====================
const open = (type, row) => {
  title.value = type === 'add' ? '新增设备' : '编辑设备'
  
  if (type === 'add') {
    Object.assign(form, {
      id: null,
      name: '',
      model: '',
      orgId: null,
      ownerId: null,
      status: '在线',
      rtmp: ''
    })
  } else {
    Object.assign(form, row)
  }
  visible.value = true
}

// ==================== 提交 ====================
const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // ========== 模拟提交 ==========
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // ========== 真实接口 ==========
        // if (title.value === '新增设备') {
        //   await request.post('/api/devices', form)
        // } else {
        //   await request.put(`/api/devices/${form.id}`, form)
        // }
        
        ElMessage.success(title.value === '新增设备' ? '新增成功' : '修改成功')
        visible.value = false
        emit('success')
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

defineExpose({ open })
const emit = defineEmits(['success'])
</script>