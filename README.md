# Sovue · 山海藏馆

## 本地预览与验证
在此目录运行 `npm start`，打开 http://127.0.0.1:4174 。
- `npm test`：数据模型与浏览状态测试。
- `npm run test:issues`：Issue 处理与静态构建测试。
- `npm run build`：生成可发布的 `dist/`，支持 GitHub Pages 仓库子路径。

## 页面与维护边界
- `index.html`：入馆场景、直接搜索、继续上次浏览、分类入口。
- `collection.html`：独立馆藏列表；详情保持弹窗，不另建详情页。
- `assets/home.js`、`collection.js`、`details.js`：分别维护入口、列表、详情。
- `assets/ui.js`：共用导航、主题、动效设置与对话框。
- `assets/state.js`：分类、搜索、排序、珍藏筛选与滚动位置恢复。
- `assets/repository.js`、`model.js`：读取与规范化数据。
- `assets/style.css`、`pages.css`：共用样式与分页面布局。
- 旧 `assets/app.js` 为未加载的早期单页实现，不进入发布产物。

## 内容收录
`data/items.json` 保留交接包的 3 条原始记录。封面缺失时用文字排版封面。新增类别还应更新共用类别名称及 Issue 表单。

网页“收录藏品”默认引导到 GitHub Issue；临时收录只存在当前浏览器。珍藏标记和浏览习惯也保存在浏览器中，清理站点数据会丢失，可用导出功能备份馆藏。

自动分类默认规则：Bilibili/b23 链接归视频，Xiaohongshu/xhslink 归灵感笔记，图片扩展名链接归壁纸，其余归网站。Issue 下拉选择可覆盖规则；COS 需手选。不抓取网页推断题材。

## GitHub Pages 部署
1. 确认 `config.js` 的仓库名（当前准备值 `xuejiehsuej/vault`，未在远端核验）。将本目录内容作为仓库根目录，包括 `.github/`。
2. 使用 `main` 分支，在仓库 Settings → Pages 中选择 GitHub Actions。启用 Actions，并确保工作流允许写入 contents/issues；分支规则须允许自动数据提交。
3. `Process Vault Issue` 仅处理仓库所有者提交且由所有者触发的管理 Issue；校验链接、自动分类、更新 JSON。重复提交不重复添加，编辑同一 Issue 更新原条目，并发写入会重试。
4. `Deploy Vault Pages` 测试并构建 `dist/` 后发布；发布成功后关闭已包含在部署中的待处理 Issue。错误留在 Issue/Actions 中供检查。

本地已实现与测试上述逻辑，尚未向远端提交、部署或执行真实 Issue 全流程。

## 动态场景
当前底图 `assets/realm-ink-v3.png` 基于用户参考编辑，扩大天穹与地面之间的留白。`realm.js` 用 WebGL 图像空间纹理平流和局部金色高光模拟笔触内部流动，地面保持低幅度微动。这是 2.5D 图像动画。

首页承载完整场景，列表不运行背景画布。支持流动、轻动、静止；默认约 30 FPS、轻动约 15 FPS，离开视口或隐藏页面停绘，系统减少动效默认静止，WebGL 不可用时用静态底图。返回入口不重复播放首次入场。长期视觉舒适度仍需实际使用反馈。

验证记录见 `docs/verification.md`。
