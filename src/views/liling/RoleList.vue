<template>
  <el-card>
    <!-- 操作栏 -->
    <div style="margin-bottom: 16px">
      <el-button type="primary" @click="handleAddRole">新增角色</el-button>
    </div>

    <!-- 角色表格 -->
    <el-table :data="roleList" border>
      <el-table-column prop="name" label="角色名称" width="180">
        <template #default="{ row }">
          <el-tag :type="row.name === 'admin' ? 'danger' : 'primary'">
            {{ row.name === 'admin' ? '管理员' : row.name === 'user' ? '普通用户' : row.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="code" label="角色编码" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="userCount" label="用户数" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="primary" link @click="handleConfigPermission(row)">权限配置</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
