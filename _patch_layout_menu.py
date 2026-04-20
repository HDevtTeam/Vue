from pathlib import Path

p = Path(__file__).resolve().parent / "src" / "components" / "layout" / "layout.vue"
text = p.read_text(encoding="utf-8")

text = text.replace(
    "  VideoCamera, \n  List, \n  Search, \n  Document, ",
    "  VideoCamera, \n  Document, ",
)

start = text.find("        <!-- 巡检员和管理员可见 -->\n        <el-menu-item")
if start < 0:
    raise SystemExit("start marker not found")

end = text.find("      </el-menu>", start)
if end < 0:
    raise SystemExit("end </el-menu> not found")

new_menu = """        <!-- 巡检员和管理员可见 -->
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
          <el-icon><Setting /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>

        <el-menu-item index="admin-device">
          <el-icon><Document /></el-icon>
          <template #title>设备管理</template>
        </el-menu-item>

        <!-- 管理员菜单 -->
<el-sub-menu v-if="userInfo.role === 'ADMIN'" index="admin">
  <template #title>
    <el-icon><Setting /></el-icon>
    <span>系统管理</span>
  </template>
  <el-menu-item index="admin-users">用户管理</el-menu-item>
  <el-menu-item index="admin-orgnization">组织管理</el-menu-item>
</el-sub-menu>
"""

p.write_text(text[:start] + new_menu + text[end:], encoding="utf-8")
print("patched", p)
