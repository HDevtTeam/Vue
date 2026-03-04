<template>
  <el-card>
    <!-- 搜索栏 -->
    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="6">
        <el-input placeholder="用户名/手机号" v-model="searchKeyword" />
      </el-col>
      <el-col :span="6">
        <el-select placeholder="选择角色" v-model="searchRole">
          <el-option label="管理员" value="admin" />
          <el-option label="普通用户" value="user" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select placeholder="状态" v-model="searchStatus">
          <el-option label="正常" value="active" />
          <el-option label="停用" value="disabled" />
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="success" @click="handleAdd">新增用户</el-button>
      </el-col>
    </el-row>

    <!-- 用户表格 -->
    <el-table :data="userList" v-loading="loading" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="role" label="角色">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'primary'">
            {{ row.role === 'admin' ? '管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link @click="handleResetPwd(row)">重置密码</el-button>
          <el-button type="danger" link @click="handleDisable(row)">停用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @current-change="fetchData"
      layout="prev, pager, next, jumper"
      style="margin-top: 16px; justify-content: flex-end"
    />
  </el-card>

  <!-- 新增/编辑用户弹窗 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
    <el-form :model="formData" label-width="100px">
      <el-form-item label="用户名" required>
        <el-input v-model="formData.username" />
      </el-form-item>
      <el-form-item label="姓名" required>
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="formData.phone" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="formData.email" />
      </el-form-item>
      <el-form-item label="角色" required>
        <el-radio-group v-model="formData.role">
          <el-radio value="admin">管理员</el-radio>
          <el-radio value="user">普通用户</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>
