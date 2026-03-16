import request from '@/utils/request'

// 后端路径为 /api/users
// 获取所有用户
export const getUserList = () => {
  return request({
    url: '/users',
    method: 'get'
  })
}

// 新增用户
export const addUser = (data) => {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

// 更新用户
export const updateUser = (data) => {
  return request({
    url: '/users',
    method: 'put',
    data
  })
}

// 删除用户
export const deleteUser = (id) => {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
}

// 通过ID查询单个用户
export const getUserById = (id) => {
  return request({
    url: `/users/id?id=${id}`,
    method: 'get'
  })
}

// 通过用户名查询单个用户
export const getUserByName = (name) => {
  return request({
    url: `/users/name?name=${name}`,
    method: 'get'
  })
}