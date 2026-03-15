import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器（发请求时带上token）
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      // 把token放在请求头的token字段里（不是Authorization）
      config.headers['token'] = token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（处理响应）
service.interceptors.response.use(
  response => {
    // 登录成功后，从响应头里拿token
    const token = response.headers['token']
    if (token) {
      localStorage.setItem('token', token)
    }

    const res = response.data
    const code = res?.code ?? res?.commonResultResponse?.code
    const msg = res?.msg ?? res?.message ?? res?.commonResultResponse?.message
    
    // 如果返回的状态码不是200，说明接口请求失败
    if (code !== 200) {
      if (code === 401 && router.currentRoute.value.path === '/login') {
        ElMessage.error('账号或密码错误')
      } else {
        ElMessage.error(msg || '请求失败')
      }
      
      // 401: 未登录或token过期
      if (code === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        router.replace('/login')
      }
      
      return Promise.reject(new Error(msg || '请求失败'))
    } else {
      return res
    }
  },
  error => {
    console.error('响应错误:', error)
    
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')

      if (router.currentRoute.value.path === '/login') {
        ElMessage.error('账号或密码错误')
      } else {
        ElMessage.error('登录已过期，请重新登录')
        router.replace('/login')
      }
    } else {
      ElMessage.error(error.response?.data?.msg || '服务器异常，请稍后重试')
    }
    
    return Promise.reject(error)
  }
)

export default service