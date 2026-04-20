<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Fold, 
  Expand,
  User, 
  VideoCamera, 
  Cpu,
  DataLine,
  ArrowRight,
  Setting,
  Tools,
  OfficeBuilding
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const isCollapse = ref(false)
const router = useRouter()
const isLoggedIn = ref(false)
const userInfo = ref({
  name: '用户',
  role: '',
  userName: ''
})

// 安全导航方法
const safeNavigate = (path) => {
  try {
    console.log('安全导航到:', path)
    router.push(path)
    return true
  } catch (error) {
    console.error('导航错误:', error)
    ElMessage.error('导航失败，请重试')
    return false
  }
}

const handleSelect = (key) => {
  try {
    console.log('菜单选择:', key)
    
    // 处理管理员子菜单的导航
    if (key.startsWith('admin-')) {
      // 将 'admin-users' 转换为 '/admin/users'
      // 使用正则表达式替换第一个破折号
      const path = key.replace(/^admin-/, 'admin/')
      console.log('导航到管理页面:', '/' + path)
      safeNavigate('/' + path)
    } else {
      console.log('导航到页面:', '/' + key)
      safeNavigate('/' + key)
    }
  } catch (error) {
    console.error('导航错误:', error)
    ElMessage.error('导航失败，请重试')
  }
}

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const goToLogin = () => {
  router.push('/login')
}

const logout = async () => {
  try {
    // 清除本地存储
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // 更新状态
    isLoggedIn.value = false
    userInfo.value = { name: '用户', role: '', userName: '' }
    
    ElMessage.success('已退出登录')
    // 跳转到登录页
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 错误处理已在request.js中统一处理
  }
}

const DEMO_TOKEN = 'demo-admin-token'

// 验证登录状态
const checkLoginStatus = async () => {
  console.log('开始验证登录状态')
  try {
    const token = localStorage.getItem('token')

    if (!token) {
      isLoggedIn.value = false
      return
    }

    // 演示账号：不请求后端，直接使用 localStorage 中的用户信息
    if (token === DEMO_TOKEN) {
      const stored = localStorage.getItem('userInfo')
      if (stored) {
        try {
          const info = JSON.parse(stored)
          isLoggedIn.value = true
          userInfo.value = {
            name: info.name || '演示管理员',
            role: info.role || 'ADMIN',
            userName: info.userName || 'admin'
          }
        } catch (e) {
          handleLoginExpired()
        }
      } else {
        handleLoginExpired()
      }
      return
    }

    // 正式账号：有 token 就认为已登录，不需要请求后端验证
    isLoggedIn.value = true
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      try {
        const info = JSON.parse(stored)
        userInfo.value = {
          name: info.name || '用户',
          role: (info.role || 'ADMIN').toString().toUpperCase(),
          userName: info.userName || ''
        }
      } catch (e) {
        userInfo.value = { name: '用户', role: 'ADMIN', userName: '' }
      }
    } else {
      userInfo.value = { name: '用户', role: 'ADMIN', userName: '' }
    }

  } catch (error) {
    console.error('验证登录状态失败:', error)
    handleLoginExpired()
  }
}

// 处理登录过期
const handleLoginExpired = () => {
  isLoggedIn.value = false
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  userInfo.value = { name: '用户', role: '', userName: '' }
  router.push('/login')
}

onMounted(() => {
  // 验证身份权限
  checkLoginStatus()
})
</script>

<template>
  <el-container class="layout-container">
    <!-- 顶部大标题区域 -->
    <el-header class="top-header">
      <div class="top-header-inner">
        <h1 class="system-title">无人机检测系统</h1>
        <div class="header-right">
          <template v-if="isLoggedIn">
            <el-dropdown>
              <span class="user-info">
                <el-icon><User /></el-icon>
                <span>{{ userInfo.name }}</span>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" size="small" @click="goToLogin">登录</el-button>
          </template>
        </div>
      </div>
    </el-header>

    <!-- 顶部标题下方：左侧导航 + 右侧内容 -->
    <el-container class="content-layout">
      <el-aside :width="isCollapse ? '76px' : '260px'" class="aside">
        <el-menu
          :default-active="$route.path.substring(1).replace('/', '-')"
          class="el-menu-vertical"
          :collapse="isCollapse"
          @select="handleSelect"
        >
          <!-- 巡检员和管理员可见 -->
          <el-menu-item v-if="['INSPECTOR', 'ADMIN'].includes(userInfo.role)" index="monitor">
            <el-icon><VideoCamera /></el-icon>
            <template #title>视频监控</template>
          </el-menu-item>

          <!-- 所有用户可见 -->
          <el-menu-item index="reports">
            <el-icon><DataLine /></el-icon>
            <template #title>统计报表</template>
          </el-menu-item>

          <!-- 所有人可见 -->
          <el-menu-item index="admin-system">
            <el-icon><Tools /></el-icon>
            <template #title>系统配置</template>
          </el-menu-item>

          <el-menu-item index="admin-device">
            <el-icon><Cpu /></el-icon>
            <template #title>设备管理</template>
          </el-menu-item>

          <!-- 管理员菜单 -->
          <el-sub-menu v-if="userInfo.role === 'ADMIN'" index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理员权限</span>
            </template>
            <el-menu-item index="admin-users">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="admin-orgnization">
              <el-icon><OfficeBuilding /></el-icon>
              <span>组织管理</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
        <div class="menu-footer">
          <el-icon class="toggle-button" @click="toggleCollapse">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
      </el-aside>

      <el-main class="main">
        <div class="main-content-card">
          <router-view></router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  background: #f5f8fc;
}

.top-header {
  height: 72px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #e6edf5;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.top-header-inner {
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.system-title {
  margin: 0;
  font-size: 30px;
  color: #1f2d3d;
  font-weight: 700;
  letter-spacing: 1px;
}

.header-right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  background: #f1f6fd;
  color: #2f3e54;
  border: 1px solid #e2eaf5;
}

.user-info .el-icon {
  margin-right: 8px;
}

.arrow-icon {
  margin-left: 6px;
  font-size: 12px;
}

.content-layout {
  height: calc(100vh - 72px);
  padding: 16px;
  box-sizing: border-box;
  gap: 16px;
}

.aside {
  background: #ffffff;
  border: 1px solid #e5ecf5;
  border-radius: 16px;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
}

.el-menu-vertical {
  border-right: none;
  flex-grow: 1;
  background: transparent;
  padding: 10px 8px;
}

.menu-footer {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e5ecf5;
}

.toggle-button {
  color: #55708f;
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease;
}

.toggle-button:hover {
  transform: scale(1.08);
  color: #2f6feb;
}

.main {
  padding: 0;
}

.main-content-card {
  height: 100%;
  overflow: auto;
  background: #ffffff;
  border: 1px solid #e6edf6;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

/* 深度选择器，调整 Element Plus 菜单风格 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  margin: 6px 6px;
  min-height: 46px;
  line-height: 46px;
  border-radius: 10px;
  color: #3c4b5d;
  font-size: 15px;
  font-weight: 600;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: #edf4ff;
  color: #2563eb;
}

:deep(.el-menu-item.is-active) {
  color: #ffffff;
  background: #3b82f6;
  box-shadow: none;
}

:deep(.el-sub-menu .el-menu-item) {
  margin-left: 18px;
  min-height: 42px;
  line-height: 42px;
  font-size: 14px;
  font-weight: 500;
  border-left: 2px solid #e6edf5;
  border-radius: 0 8px 8px 0;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  border-left-color: #3b82f6;
  background: #dbeafe;
  color: #1d4ed8;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  color: inherit;
}

/* 需求覆盖：菜单尺寸与浅色蓝白主题 */
.layout-container {
  background: #f5f7fa;
}

.aside {
  background: #ffffff;
}

:deep(.el-menu) {
  background: #ffffff;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 52px;
  line-height: 52px;
  font-size: 14px;
  margin-top: 6px;
}

:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  font-size: 20px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: #ecf5ff;
  color: #409eff;
}

:deep(.el-menu-item.is-active) {
  color: #409eff;
  background: #ffffff;
}

:deep(.el-sub-menu .el-menu-item.is-active) {
  color: #409eff;
  background: #ffffff;
  border-left-color: #409eff;
}

:deep(.el-menu-item-group__title) {
  font-size: 13px;
  color: #909399;
}
</style>
