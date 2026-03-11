# Log.md — MDP 網格地圖作業 HW1 操作日誌

> 所有開發動作、功能新增、修改紀錄均記載於此。

---

## 2026-03-11

### [初始化] 專案規劃與目錄建立
- **時間**：2026-03-11
- **操作**：制定完整開發規劃，建立專案目錄結構 `C:\hw1\`
- **建立目錄**：
  - `C:\hw1\`
  - `C:\hw1\templates\`
  - `C:\hw1\static\`
- **說明**：依照 HW1-1、HW1-2、HW1-3 需求制定功能開發流程

---

### [HW1-1] 建立網格地圖核心邏輯 — `grid_logic.py`
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\grid_logic.py`
- **功能**：
  - 定義 MDP 行動集合：上(↑)、下(↓)、左(←)、右(→)
  - `generate_random_policy(n, start, goal, obstacles)`：隨機生成每格策略
  - `get_next_state(n, state, action, obstacles)`：計算移動後狀態（碰牆留原地）
  - `policy_evaluation(n, policy, start, goal, obstacles)`：策略評估，迭代計算 V(s)
  - `value_iteration(n, start, goal, obstacles)`：價值迭代，計算最佳策略與最佳 V(s)
  - `serialize_policy(policy)` / `serialize_values(V)`：JSON 序列化輔助函式
- **參數設定**：γ=0.9, 終點獎勵=+10, 每步懲罰=-0.1, 收斂閾值=1e-6

---

### [HW1-1] 建立 Flask 應用程式 — `app.py`
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\app.py`
- **API 路由**：
  - `GET  /`：渲染主頁面
  - `POST /api/init`：初始化網格（傳入 n，session 重置）
  - `POST /api/set_cell`：設定格子類型（start/goal/obstacle/clear），驗證障礙物上限 n-2
  - `POST /api/random_policy`：生成隨機策略並進行策略評估，回傳 policy_symbols + values
  - `POST /api/value_iteration`：執行價值迭代，回傳最佳 policy_symbols + values
  - `GET  /api/state`：取得當前 session 狀態
- **安全性**：使用 `secrets.token_hex(32)` 生成 session secret key

---

### [HW1-1] 建立前端主頁面 — `templates/index.html`
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\templates\index.html`
- **功能**：
  - 網格大小選擇（5×5 ~ 9×9）
  - 點擊模式按鈕：設起點、設終點、設障礙、清除格
  - 障礙物數量即時顯示（n-2 上限）
  - HW1-2 / HW1-3 演算法觸發按鈕
  - 顯示選項：可切換策略箭頭與 V(s) 數值顯示
  - 圖例說明、操作說明區塊
  - 訊息提示框（成功/錯誤/資訊）

---

### [HW1-1] 建立前端樣式 — `static/style.css`
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\static\style.css`
- **功能**：
  - 響應式設計（支援小螢幕 600px 以下）
  - 格子顏色：起點=綠色(#68d391)、終點=紅色(#fc8181)、障礙物=灰色(#718096)
  - V(s) 熱力圖著色：高值=淺綠、中值=黃色、低值=淺紅
  - 按鈕懸停動畫、格子縮放特效
  - 訊息框淡入動畫

---

### [HW1-2 / HW1-3] 建立前端互動邏輯 — `static/script.js`
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\static\script.js`
- **功能**：
  - 網格渲染（動態生成 n×n 格子 DOM）
  - 格子點擊事件：根據模式呼叫 `/api/set_cell`
  - 初始化按鈕：呼叫 `/api/init` 並重置前端狀態
  - HW1-2 按鈕：呼叫 `/api/random_policy`，取得隨機策略符號與 V(s)
  - HW1-3 按鈕：呼叫 `/api/value_iteration`，取得最佳策略符號與最佳 V(s)
  - `togglePolicy` / `toggleValue` checkbox：切換箭頭與數值顯示
  - `applyHeatColor()`：依 V(s) 數值套用熱力圖顏色
  - 實時更新障礙物計數顯示
  - 訊息自動消失計時器

---

### [系統] 建立 Log.md 操作日誌
- **時間**：2026-03-11
- **新增檔案**：`C:\hw1\Log.md`
- **說明**：記錄所有開發動作與操作紀錄

---

---

### [測試] Flask 伺服器啟動與 API 端對端測試
- **時間**：2026-03-11
- **操作**：安裝 Flask 3.1.3（Python 3.10），啟動開發伺服器於 `http://127.0.0.1:5000`
- **grid_logic 模組驗證**：
  - `generate_random_policy(5, [0,0], [4,4], [[1,1],[2,2],[3,3]])` → 25 個格子策略 ✓
  - `policy_evaluation()` → V(goal)=10.0 ✓
  - `value_iteration()` → 最佳策略 goal=[4,4] V=10.0 ✓
- **API 端對端測試**（全部通過 ✓）：
  - `POST /api/init {"n":5}` → `{"n":5,"status":"ok"}` ✓
  - `POST /api/set_cell {"r":0,"c":0,"type":"start"}` → status: ok ✓
  - `POST /api/set_cell {"r":4,"c":4,"type":"goal"}` → status: ok ✓
  - `POST /api/set_cell {"r":2,"c":2,"type":"obstacle"}` → status: ok, count: 1 ✓
  - `POST /api/random_policy` → status: ok, policy_symbols 25 keys ✓
  - `POST /api/value_iteration` → status: ok, V(goal)=10.0 ✓

---

## 專案完整檔案清單

| 檔案 | 說明 |
|------|------|
| `app.py` | Flask 主應用程式，所有 API 路由 |
| `grid_logic.py` | MDP 核心邏輯：隨機策略、策略評估、價值迭代 |
| `templates/index.html` | 前端主頁面 |
| `static/style.css` | 前端樣式表 |
| `static/script.js` | 前端互動 JavaScript |
| `Log.md` | 本操作日誌 |

---

## 演算法參數說明

| 參數 | 值 | 說明 |
|------|----|------|
| γ (gamma) | 0.9 | 折扣因子 |
| 終點獎勵 | +10.0 | 到達 goal 的即時獎勵 |
| 每步懲罰 | -0.1 | 非終點轉移的即時獎勵 |
| 收斂閾值 θ | 1e-6 | 策略評估/價值迭代停止條件 |
| 碰牆規則 | 留原地 | 移動到障礙物或牆壁外時保持原狀態 |
