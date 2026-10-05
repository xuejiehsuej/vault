# Verification · 2026-09-10

## Initial version, before visual correction
- Node: 5 data-model tests passed; app.js and realm.js syntax checks passed.
- In-app browser: desktop 1934px and mobile 390x844 viewed. No horizontal overflow; remote wallpaper loaded; error/warning log empty.
- Search Gmeek produced 1 result. Category with zero records showed empty state. Detail, favorite/unfavorite, local add and reload persistence verified. QA temporary record removed via UI; 3 original records remain.
- Pause verified by unchanged rendered frame counter (9910 before/after search). Shader initialized and canvas became ready.
- Light mobile collection visually checked.
- Final browser pass was rejected by automatic approval review citing usage limit. Do not substitute unit tests for browser acceptance.

## Reference-directed correction
User rejected generic mountain-and-gold-ribbon image. New reference is the user's second screenshot: heavy black/gold calligraphic sky and long brush-drawn ground curves.
- Generated reference-guided edit with built-in imagegen, inspected returned image, saved assets/realm-ink-v2.png (2,903,772 bytes).
- Both CSS fallback and WebGL texture now reference realm-ink-v2.png. Old realm.png retained as unused earlier version.
- Expanded sky flow mask, added two-phase directional texture transport estimated along brush tangents, reduced broad distortion and ground motion.
- 5 Node tests pass after correction; realm.js syntax check passes. These do not compile GLSL or verify animation appearance.
- Corrected version has NOT yet been rechecked in the browser because the prior automatic approval block remains unresolved. Live shader compilation, frame comparison, mobile composition and sustained comfort remain pending.
- JSON download, remote GitHub workflow, full reduced-motion/context-loss checks and sustained frame-rate measurement are not yet verified.

## Multipage refinement · 2026-09-11 (current)
This section supersedes the older unresolved browser-blocker and v2 asset statements above.
- Current background: realm-ink-v3.png, with enlarged open air between ceiling and ground; CSS fallback and shader use the same asset.
- Separate entrance and collection pages; shared UI/data/state modules; image-led detail modal.
- Fresh verification: 9 Node tests and 8 Python tests passed; npm run build passed (4 entry files, 11 assets, 3 original items).
- Desktop browser earlier in this iteration: entrance rendered with working WebGL; homepage Gmeek search returned one collection result; wallpaper category and oldest sort persisted on reload; quiet detail inspected.
- Mobile browser 390x844: homepage and collection screenshots inspected; document scrollWidth 375 <= viewport 390; header controls and collection navigation accessible.
- Wallpaper detail opened; Escape closed it and focus returned to its originating card. Scroll after close was 922px; reloading collection restored exactly 922px.
- Static motion: canvas stayed at frames=633/time=24.19 across separate calls; light motion then advanced to frames=1350/time=53.13. Restored full motion after checks.
- Built /dist/index.html loaded and linked successfully to /dist/collection.html; collection rendered all 3 entries and contained zero canvases. Browser error log empty.
- Reduced/static dialog closing now skips the closing-animation delay, consistent with opening behavior.
- GitHub workflow implementation is local only. Remote repository settings, branch permissions, actual Issue processing and Pages deployment have NOT been verified. Sustained performance/comfort and context-loss recovery remain outside this pass.

## 赤金专题与珍藏导航 · 2026-09-11
馆藏页新增赤金铸藏场景（assets/forge-v1.png），以用户第二张参考图生成，包含青铜炉、粗锁链与石质巨兽。首页未修改；珍藏视图隐藏专题，直接显示收藏。局部暖光支持静止/轻动设置。
修复视图辨识及导航：保留 view/category/q/sort 地址参数；我的珍藏显示独立标题、数量与选中导航；总览显式退出珍藏筛选；匹配地址的重载仍恢复滚动。
验证：11 Node + 8 Python 测试通过，构建通过。桌面/390px 手机点击珍藏得到 1 项，返回总览得到 3 项；珍藏标题为我的珍藏01，导航正确，浏览器 error 日志为空。手机无横向溢出（375 <= 390）。线上未部署。

## Continuous backgrounds and enclosed gorge · 2026-09-11
Added assets/immersion.css to both page entries. The collection uses a continuous forge background behind translucent header, filters and cards; favorites uses valley-v3.png, an enclosed rock gorge without sky or distant peaks. V1 open mountains and V2 dense moss/stone detail were rejected by user; V3 removes stairs, most vegetation and reduces fragmented surface detail. Home keeps its original hero, extending its existing artwork under translucent lower content/footer. Dialog backdrops allow subdued scenery through.
Build succeeded with 14 assets; 8 Python/build checks passed. Favorites page loaded with correct view and HTML. Final screenshot attempt was interrupted by the in-app browser reporting the new tab no longer belonged to the session; final all-page visual acceptance remains pending.
