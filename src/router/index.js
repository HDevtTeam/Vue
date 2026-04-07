import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/layout/layout.vue'
import { ElMessage } from 'element-plus'
//import Organization from '@/views/liling/organization.vue';
//import { getMainChartData, getTypeDistributionData, createExportTask, downloadFile, getTaskStatus } from '@/api/report'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/Register.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/',
      component: Layout,
      // 移除静态重定向，将在路由守卫中动态处理
      children: [
        {
          path: 'monitor',
          name: 'Monitor',
          component: () => import('../views/Monitor.vue'),
          meta: {
            requiresAuth: true,
            roles: ['INSPECTOR', 'ADMIN']
          }
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: () => import('../views/Tasks.vue'),
          meta: {
            requiresAuth: true,
            roles: ['INSPECTOR', 'ADMIN']
          }
        },
        {
          path: 'detection',
          name: 'Detection',
          component: () => import('../views/Detection.vue'),
          meta: {
            requiresAuth: true,
            roles: ['PUBLIC', 'COMMON', 'INSPECTOR', 'ADMIN']
          }
        },
        {
          path: 'history',
          name: 'History',
          component: () => import('../views/History.vue'),
          meta: {
            requiresAuth: true,
            roles: ['PUBLIC', 'COMMON', 'INSPECTOR', 'ADMIN']
          }
        },

        {
          path: 'reports',
          name: 'Reports',
          component: () => import('../views/reports/index.vue'),
          meta: {
            requiresAuth: true,
            roles: ['PUBLIC', 'COMMON', 'INSPECTOR', 'ADMIN']
          }
        }

      ]
    },

    //所有 /admin/xxx 的页面，都需要管理员权限。

    {
      path: '/admin',
      component: Layout,
      meta: {
        requiresAuth: true,
        roles: ['ADMIN']
      },
      children: [
        {
          path: 'users',
          name: 'UserManagement',
          component: () => import('../views/admin/Users.vue'),
          meta: {
            requiresAuth: true,
            roles: ['ADMIN']
          }
        },
        {
          path: 'system',
          name: 'SystemConfig',
          component: () => import('../views/admin/System.vue'),
          meta: {
            requiresAuth: true,
            roles: ['ADMIN']
          }
        },
        {
          path: 'orgnization',
          name: 'Organization',
          component: () => import('../views/org/orgnization.vue'),
          meta: {
            requiresAuth: true,
            roles: ['ADMIN']
          }
        },
        {
          path: 'device',  // /admin/device
          name: 'DeviceList',
          component: () => import('../views/admin/device/list.vue'),
          meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
          path: 'device/detail/:id',  // /admin/device/detail/DEV001
          name: 'DeviceDetail',
          component: () => import('../views/admin/device/detail.vue'),
          meta: { requiresAuth: true, roles: ['ADMIN'] }
        },
        {
          path: 'device/config/:id',  // /admin/device/config/DEV001
          name: 'DeviceConfig',
          component: () => import('../views/admin/device/config.vue'),
          meta: { requiresAuth: true, roles: ['ADMIN'] }
        }
      ]
    },
    {
      // 捕获所有未匹配的路由，重定向到首页
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// 解析Base64URL编码的字符串
function parseBase64Url(base64Url) {
  // 将Base64URL转换为标准Base64
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // 解码Base64
  const decoded = atob(base64);
  // 将解码后的字符串转换为JSON对象
  try {
    return JSON.parse(decoded);
  } catch (e) {
    console.error('解析Base64URL失败:', e);
    return {};
  }
}

// 从JWT token中提取payload
function parseJwtToken(token) {
  if (!token) return {};
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    return parseBase64Url(parts[1]);
  } catch (error) {
    return {};
  }
}

// 路由守卫
router.beforeEach((to, from) => {
  try {
    console.log('路由守卫触发:', to.path)

    // 安全获取token
    const token = localStorage.getItem('token')
    console.log('当前token状态:', token ? '已存在' : '不存在')

    // 从token中解析用户信息（支持演示账号）
    let userRole = null
    const DEMO_TOKEN = 'demo-admin-token'

    try {
      if (token) {
        if (token === DEMO_TOKEN) {
          const stored = localStorage.getItem('userInfo')
          if (stored) {
            try {
              const info = JSON.parse(stored)
              userRole = info.role || 'ADMIN'
            } catch (e) { }
          }
          if (!userRole) userRole = 'ADMIN'
        } else {
          const payload = parseJwtToken(token)
          userRole = payload.role ? String(payload.role).toUpperCase() : null
          // JWT 解析失败或没有 role 时，尝试从 localStorage.userInfo 兜底
          if (!userRole) {
            const stored = localStorage.getItem('userInfo')
            if (stored) {
              try {
                const info = JSON.parse(stored)
                userRole = info.role ? String(info.role).toUpperCase() : null
              } catch (e) { }
            }
          }
        }
        console.log('当前用户角色:', userRole ?? '(未解析到，将要求重新登录)')
      }
    } catch (error) {
      console.error('解析token失败:', error)
    }

    // token 存在但无法解析出有效角色 → 视为无效 token，清除并跳转登录
    if (token && userRole == null) {
      console.warn('token 无效或已过期，清除并跳转登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      if (to.path !== '/login' && to.path !== '/register') {
        ElMessage.warning('登录已过期，请重新登录')
        return '/login'
      }
      return true
    }

    // 未登录，且访问/
    if (!token && to.path === '/') {
      console.log('未登录，跳转到登录页')
      return '/login'
    }

    // 不需要认证的页面
    if (!to.meta.requiresAuth) {
      // 处理根路径的动态重定向
      if (to.path === '/') {
        console.log('访问根路径，根据角色重定向')
        if (userRole === 'PUBLIC' || userRole === 'COMMON') {
          return '/detection'
        } else if (userRole === 'INSPECTOR' || userRole === 'ADMIN') {
          return '/monitor'
        } else {
          return '/detection'
        }
      }
      console.log('访问无需认证页面')
      // 如果已登录且试图访问登录/注册页，重定向到首页
      if (token && ['/login', '/register'].includes(to.path)) {
        console.log('已登录用户重定向到首页')
        return '/'
      }
      return true
    }

    // 需要认证但没有token
    if (!token) {
      console.log('需要认证但无token，重定向到登录页')
      ElMessage.warning('请先登录')
      return '/login'
    }


    // 检查角色权限
    if (to.meta.roles && Array.isArray(to.meta.roles) && !to.meta.roles.includes(userRole)) {
      console.log('用户角色无权限访问该页面')
      ElMessage.error('您没有权限访问该页面')

      // 根据角色重定向到合适的页面
      if (userRole === 'PUBLIC' || userRole === 'COMMON') {
        return '/detection'
      } else if (userRole === 'INSPECTOR' || userRole === 'ADMIN') {
        return '/monitor'
      } else {
        return '/detection'
      }
    }

    console.log('权限检查通过，允许访问:', to.path)
    return true

  } catch (error) {
    console.error('路由守卫出错:', error)
    // 发生错误时，重定向到安全页面
    ElMessage.error('系统出错，请重新登录')
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    return '/login'
  }
})

export default router