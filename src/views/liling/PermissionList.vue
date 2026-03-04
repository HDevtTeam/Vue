<template>
  <el-row :gutter="16">
    <!-- 左侧：菜单权限树 -->
    <el-col :span="12">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>菜单权限</span>
            <el-button type="primary" link>全选/取消</el-button>
          </div>
        </template>
        <el-tree
          :data="menuTree"
          show-checkbox
          node-key="id"
          default-expand-all
          ref="menuTreeRef"
        >
          <template #default="{ node, data }">
            <span>{{ data.name }}</span>
            <span style="color: #999; margin-left: 8px">{{ data.path }}</span>
          </template>
        </el-tree>
      </el-card>
    </el-col>

    <!-- 右侧：功能权限 -->
    <el-col :span="12">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>功能权限</span>
          </div>
        </template>
        <el-table :data="functionPermissions" border>
          <el-table-column prop="module" label="模块" />
          <el-table-column prop="name" label="权限名称" />
          <el-table-column label="授权" width="200">
            <template>
              <el-checkbox>查看</el-checkbox>
              <el-checkbox>新增</el-checkbox>
              <el-checkbox>编辑</el-checkbox>
              <el-checkbox>删除</el-checkbox>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-col>
  </el-row>

  <!-- 底部按钮 -->
  <div style="margin-top: 16px; text-align: center">
    <el-button type="primary" @click="savePermission">保存权限</el-button>
    <el-button @click="resetPermission">重置</el-button>
  </div>
</template>
