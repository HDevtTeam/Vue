<template>
  <div class="p-6">
    <!-- 练习1的按钮 -->
    <el-button type="primary" @click="fetchPost">获取测试数据</el-button>
    <!-- 练习2的按钮 -->
    <el-button type="success" @click="simulateGetUsers">模拟获取用户</el-button>

    <div class="mt-4">
      <h3>模拟用户数据：</h3>
      <pre>{{ simulatedUsers }}</pre>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const postData = ref(null)
// 练习2：模拟用户数据
const simulatedUsers = ref([])

// ... 练习1的代码 ...

// 练习2：模拟调用 /api/users 接口
const simulateGetUsers = async () => {
  try {
    // 这里我们还是用公开测试接口，但假设它返回的格式像文档一样
    const response = await axios.get('https://jsonplaceholder.typicode.com/users')
    
    // 假设这是接口返回的完整响应
    const apiResponse = {
      code: 200,
      data: response.data, // 把真正的用户数据放在 data 字段里
      message: 'success'
    }
    
    // **关键：根据文档，我们取 apiResponse.data**
    simulatedUsers.value = apiResponse.data
    ElMessage.success('模拟获取用户成功！')
    console.log('获取到的用户数组：', simulatedUsers.value)
  } catch (error) {
    console.error('请求失败：', error)
    ElMessage.error('请求失败')
  }
}
</script>
