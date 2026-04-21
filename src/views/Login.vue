<template>
  <div class="login-container">
    <div class="login-box">
      <h2>无人机检测系统</h2>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="name">
          <el-input
            v-model="loginForm.name"
            placeholder="请输入账号"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <div class="register-link">
          还没有账号？
          <router-link to="/register">立即注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  name: '',  // 注意字段名是 name
  password: ''
})

const loginRules = {
  name: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  console.log('最终请求地址:', request.defaults.baseURL + '/login')
console.log('请求参数:', {name: loginForm.name, password: loginForm.password})
  console.log('请求地址:', request.defaults.baseURL + '/login')
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()
    loading.value = true

    // 硬编码管理员账号密码验证
    if (loginForm.name === 'admin' && loginForm.password === 'admin123') {
      // 管理员登录成功
      const adminToken = 'admin_token_' + Date.now()
      localStorage.setItem('token', adminToken)
      localStorage.setItem('userInfo', JSON.stringify({ role: 'ADMIN', name: 'admin' }))
      ElMessage.success('管理员登录成功')
      router.push('/admin/system')
      loading.value = false
      return
    }

    const res = await request({
      url: '/login',  // 注意路径是 /api/login
      method: 'post',
      data: {
        name: loginForm.name,      // 字段名是 name
        password: loginForm.password
      }
    })

    // 登录成功
    console.log('登录返回:', res)
    const token = res.token || res.data?.token
    if (token) {
      localStorage.setItem('token', token)
      // 优先用接口返回的 userInfo，否则从 JWT 解析 role
      if (res.userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(res.userInfo))
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
          const role = (payload.role || 'ADMIN').toString().toUpperCase()
          localStorage.setItem('userInfo', JSON.stringify({ role }))
        } catch (e) {
          localStorage.setItem('userInfo', JSON.stringify({ role: 'ADMIN' }))
        }
      }
      ElMessage.success('登录成功')
      router.push('/monitor')
    } else {
      ElMessage.error('登录失败：未获取到token')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1f4037 0%, #99f2c8 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.login-box h2 {
  text-align: center;
  color: #1f4037;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: bold;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.register-link {
  text-align: center;
  margin-top: 15px;
  color: #606266;
}

.register-link a {
  color: #409EFF;
  text-decoration: none;
}
</style>