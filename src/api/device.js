import request from '@/utils/request'

// 后端路径 /api/devices

// 获取所有设备
export const getDeviceList = () => {
  return request({
    url: '/devices',
    method: 'get'
  })
}

// 批量新增设备
export const addDevices = (addDeviceList) => {
  return request({
    url: '/devices',
    method: 'post',
    data: { addDeviceList }
  })
}

// 批量更新设备
export const updateDevices = (updateDeviceList) => {
  return request({
    url: '/devices',
    method: 'put',
    data: { updateDeviceList }
  })
}

// 根据 SN 获取单个设备
export const getDeviceBySn = (sn) => {
  return request({
    url: `/devices/search/${encodeURIComponent(sn)}`,
    method: 'get'
  })
}

// 根据 SN 列表批量查询设备
export const getDevicesBySnList = (snList) => {
  return request({
    url: '/devices/search/batch',
    method: 'get',
    data: { snList }
  })
}

// 根据参数查询设备
export const getDevicesByParam = (device) => {
  return request({
    url: '/devices/search/param',
    method: 'get',
    data: { device }
  })
}

// 根据 SN 删除单个设备
export const deleteDeviceBySn = (sn) => {
  return request({
    url: `/devices/${encodeURIComponent(sn)}`,
    method: 'delete'
  })
}

// 根据 SN 列表批量删除设备
export const deleteDevicesBySnList = (deleteDeviceSnList) => {
  return request({
    url: '/devices/batch',
    method: 'delete',
    data: { deleteDeviceSnList }
  })
}
