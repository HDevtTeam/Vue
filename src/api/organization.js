import request from '@/utils/request'

// 1. 获取所有组织（返回列表，需要前端转成树形）
export const getOrganizationList = () => {
  return request({
    url: '/organizations',  // 去掉 /api
    method: 'get'
  })
}

// 2. 获取指定rootId下的组织树（后端返回树形结构）
export const getOrganizationTree = (rootId) => {
  return request({
    url: `/organizations/tree/${rootId}`,  // 去掉 /api
    method: 'get'
  })
}

// 3. 添加单个组织
export const addOrganization = (data) => {
  return request({
    url: '/organizations',  // 去掉 /api
    method: 'post',
    data: {
      addOrganizationInfo: {
        name: data.name,
        parentId: data.parentId
      }
    }
  })
}

// 4. 更新组织
export const updateOrganization = (data) => {
  return request({
    url: '/organizations',  // 去掉 /api
    method: 'put',
    data: {
      updateOrganizationInfo: {
        id: data.id,
        name: data.name,
        parentId: data.parentId,
        createTime: data.createTime || new Date().toISOString()
      }
    }
  })
}

// 5. 通过单个id获取组织
export const getOrganizationById = (id) => {
  return request({
    url: `/organizations/${id}`,  // 去掉 /api
    method: 'get'
  })
}

// 6. 通过单个名字获取单个组织
export const getOrganizationByName = (name) => {
  return request({
    url: '/organizations/search',  // 去掉 /api
    method: 'get',
    params: { name }
  })
}

// 7. 通过组织父节点获取该节点下所有组织
export const getOrganizationChildren = (parentId) => {
  return request({
    url: `/organizations/${parentId}/children`,  // 去掉 /api
    method: 'get'
  })
}

// 8. 通过给定单个id删除对应组织
export const deleteOrganization = (id) => {
  return request({
    url: `/organizations/${id}`,  // 去掉 /api
    method: 'delete'
  })
}

// 9. 通过给定多个id同时删除其与其下所有组织
export const deleteOrganizationsBatch = (ids) => {
  return request({
    url: '/organizations/batch',  // 去掉 /api
    method: 'delete',
    data: {
      deleteOrganizationIds: ids
    }
  })
}

// 10. 通过id获取该组织路径
export const getOrganizationPath = (id) => {
  return request({
    url: `/organizations/${id}/path`,  // 去掉 /api
    method: 'get'
  })
}