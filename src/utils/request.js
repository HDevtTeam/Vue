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
    // 登录、注册接口不携带 token
    const url = config.url || ''
    if (/^\/(login|register)/.test(url)) {
      return config
    }

    const token = localStorage.getItem('token')
    if (token) {
      // 仅当 token 为纯 ASCII（JWT 标准）时添加，避免非 ISO-8859-1 字符导致 setRequestHeader 报错
      if (/^[\x00-\x7F]*$/.test(token)) {
        config.headers['token'] = token
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
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
    // blob 响应（如下载文件）直接返回，不解析 JSON
    if (response.config.responseType === 'blob') {
      return res
    }
    const code = res?.code ?? res?.commonResultResponse?.code
    const msg = res?.msg ?? res?.message ?? res?.commonResultResponse?.message

    // 图表接口等返回 ChartDataResponse，无 code 字段，有 chartData/chartType 即视为成功
    if (code === undefined && (res?.chartData != null || res?.chartType != null)) {
      return res
    }

    // 部分接口用 code: 0 表示成功（如导出任务）
    if (code === 200 || code === 0) {
      return res
    }

    // 导出任务接口：返回 taskId 或 status 即视为成功
    if (code === undefined && (res?.taskId != null || res?.status != null)) {
      return res
    }

    // 如果返回的状态码不是200/0，说明接口请求失败
    if (code !== 200 && code !== 0) {
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
    }
    return res
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
