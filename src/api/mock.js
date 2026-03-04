// 模拟设备数据
export const mockDevices = [
  {
    id: 'DEV001',
    name: '无人机-01',
    model: 'DJI Mavic 3',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/001',
    orgId: 1,
    orgName: '北京项目部',
    ownerId: 1,
    ownerName: '张三',
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-03-01 14:30:00'
  },
  {
    id: 'DEV002',
    name: '无人机-02',
    model: 'DJI Air 2S',
    status: '离线',
    rtmp: 'rtmp://live.example.com/stream/002',
    orgId: 2,
    orgName: '上海项目部',
    ownerId: 2,
    ownerName: '李四',
    createTime: '2026-01-15 09:20:00',
    updateTime: '2026-02-28 16:45:00'
  },
  {
    id: 'DEV003',
    name: '无人机-03',
    model: 'Autel EVO II',
    status: '在线',
    rtmp: 'rtmp://live.example.com/stream/003',
    orgId: 1,
    orgName: '北京项目部',
    ownerId: 3,
    ownerName: '王五',
    createTime: '2026-02-01 11:30:00',
    updateTime: '2026-03-02 09:15:00'
  }
]

// 模拟组织数据
export const mockOrgs = [
  { id: 1, name: '北京项目部', parentId: null },
  { id: 2, name: '上海项目部', parentId: null },
  { id: 3, name: '广州项目部', parentId: null },
  { id: 4, name: '无人机一组', parentId: 1 },
  { id: 5, name: '无人机二组', parentId: 1 },
  { id: 6, name: '巡检组', parentId: 2 }
]

// 模拟用户数据（用于归属人）
export const mockUsers = [
  { id: 1, name: '张三', role: 'ADMIN' },
  { id: 2, name: '李四', role: 'USER' },
  { id: 3, name: '王五', role: 'USER' },
  { id: 4, name: '赵六', role: 'INSPECTOR' }
]