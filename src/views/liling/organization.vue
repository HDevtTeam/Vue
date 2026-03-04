<template>
  <div class="p-6">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">组织管理</h1>
      <el-button type="primary" @click="handleAddOrg">新增组织</el-button>
    </div>

    <el-card>
      <!-- 组织树形结构 -->
      <el-tree
        :data="orgTree"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="flex items-center justify-between w-full">
            <span>{{ node.label }}</span>
            <span>
              <el-button type="primary" link @click="handleEditOrg(data)">编辑</el-button>
              <el-button type="danger" link @click="handleDeleteOrg(data)">删除</el-button>
              <el-button type="success" link @click="handleAddChildOrg(data)">新增子组织</el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </el-card>

    <!-- 新增/编辑组织弹窗 -->
    <el-dialog v-model="orgDialog.visible" :title="orgDialog.isEdit ? '编辑组织' : '新增组织'" width="500px">
      <el-form :model="orgForm" :rules="orgRules" ref="orgFormRef" label-width="100px">
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="orgForm.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="上级组织" prop="parentId" v-if="!orgDialog.isEdit">
          <el-tree-select
            v-model="orgForm.parentId"
            :data="orgTree"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择上级组织"
            check-strictly
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orgDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitOrg" :loading="orgSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟组织树数据
const orgTree = ref([
  {
    id: 1,
    name: '总部',
    children: [
      {
        id: 2,
        name: '华北分部',
        children: [
          { id: 3, name: '北京项目部' },
          { id: 4, name: '天津项目部' }
        ]
      },
      {
        id: 5,
        name: '华东分部',
        children: [
          { id: 6, name: '上海项目部' },
          { id: 7, name: '杭州项目部' }
        ]
      }
    ]
  }
])

// 组织弹窗状态
const orgDialog = reactive({
  visible: false,
  isEdit: false
})

const orgForm = reactive({
  id: null,
  name: '',
  parentId: null
})

const orgRules = {
  name: [{ required: true, message: '请输入组织名称', trigger: 'blur' }]
}

const orgFormRef = ref(null)
const orgSubmitting = ref(false)

const handleAddOrg = () => {
  orgDialog.isEdit = false
  orgForm.id = null
  orgForm.name = ''
  orgForm.parentId = null
  orgDialog.visible = true
}

const handleAddChildOrg = (data) => {
  orgDialog.isEdit = false
  orgForm.id = null
  orgForm.name = ''
  orgForm.parentId = data.id
  orgDialog.visible = true
}

const handleEditOrg = (data) => {
  orgDialog.isEdit = true
  orgForm.id = data.id
  orgForm.name = data.name
  orgForm.parentId = data.parentId
  orgDialog.visible = true
}

const handleDeleteOrg = (data) => {
  ElMessageBox.confirm(`确定删除组织【${data.name}】吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    // 这里写删除逻辑
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const submitOrg = async () => {
  if (!orgFormRef.value) return
  await orgFormRef.value.validate(async (valid) => {
    if (valid) {
      orgSubmitting.value = true
      try {
        // 模拟提交
        await new Promise(resolve => setTimeout(resolve, 500))
        ElMessage.success(orgDialog.isEdit ? '修改成功' : '新增成功')
        orgDialog.visible = false
        // 这里刷新组织树
      } catch (error) {
        ElMessage.error('操作失败')
      } finally {
        orgSubmitting.value = false
      }
    }
  })
}
</script>
