<template>
  <el-dialog v-model="visible" :title="title" width="500px">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="设备名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入设备名称" />
      </el-form-item>
      <el-form-item label="设备SN" prop="sn">
        <el-input v-model="form.sn" placeholder="如 SN-A100-2024001" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="所属组织" prop="organizationId">
        <el-tree-select
          v-model="form.organizationId"
          :data="orgTree"
          :props="{ label: 'name', value: 'id', children: 'children' }"
          placeholder="请选择组织"
          check-strictly
          clearable
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="归属人" prop="userId">
        <el-select v-model="form.userId" placeholder="请选择归属人" clearable style="width: 100%">
          <el-option v-for="u in userList" :key="u.id" :label="u.name" :value="u.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="空闲" value="idle" />
          <el-option label="飞行中" value="flying" />
          <el-option label="维护中" value="maintenance" />
          <el-option label="故障" value="fault" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { addDevices, updateDevices } from '@/api/device'
import { getOrganizationList } from '@/api/organization'
import { getUserList } from '@/api/user'

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const title = ref('新增设备')
const isEdit = ref(false)

const orgTree = ref([])
const userList = ref([])

const form = reactive({
  id: null,
  name: '',
  sn: '',
  organizationId: null,
  userId: null,
  status: 'idle',
  createTime: '',
  updateTime: ''
})

const rules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  sn: [{ required: true, message: '请输入设备SN', trigger: 'blur' }]
}

const buildTree = (list, parentId = 0) => {
  const tree = []
  list.forEach(item => {
    if (item.parentId === parentId) {
      const children = buildTree(list, item.id)
      if (children.length) item.children = children
      tree.push(item)
    }
  })
  return tree
}

const loadOrgAndUsers = async () => {
  try {
    const [orgRes, userRes] = await Promise.all([
      getOrganizationList(),
      getUserList()
    ])
    const list = orgRes.organizationList || orgRes || []
    orgTree.value = buildTree(list, 0)
    userList.value = userRes.userList || userRes.users || []
  } catch (e) {
    console.error('加载组织/用户失败:', e)
  }
}

const open = (type, row) => {
  isEdit.value = type === 'edit'
  title.value = type === 'add' ? '新增设备' : '编辑设备'
  if (type === 'add') {
    Object.assign(form, {
      id: null,
      name: '',
      sn: '',
      organizationId: null,
      userId: null,
      status: 'idle',
      createTime: '',
      updateTime: ''
    })
  } else {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      sn: row.sn,
      organizationId: row.organizationId,
      userId: row.userId,
      status: row.status || 'idle',
      createTime: row.createTime || '',
      updateTime: row.updateTime || ''
    })
  }
  visible.value = true
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateDevices([{
          id: form.id,
          name: form.name,
          userId: form.userId,
          organizationId: form.organizationId,
          sn: form.sn,
          status: form.status,
          createTime: form.createTime || new Date().toISOString().slice(0, 19),
          updateTime: new Date().toISOString().slice(0, 19)
        }])
        ElMessage.success('修改成功')
      } else {
        await addDevices([{
          id: null,
          name: form.name,
          userId: form.userId,
          organizationId: form.organizationId,
          sn: form.sn,
          status: form.status
        }])
        ElMessage.success('新增成功')
      }
      visible.value = false
      emit('success')
    } catch (error) {
      console.error('操作失败:', error)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

defineExpose({ open })
const emit = defineEmits(['success'])

onMounted(loadOrgAndUsers)
</script>
