**專案名稱**

DRL_HW1 — 簡單的 Grid-based 強化學習作業範例（含 Web 介面）

**專案描述**

本專案為一個教學用範例，展示以格子（grid）為基礎的環境邏輯與簡單的互動式網頁介面。後端由 `app.py` 提供（輕量型 Flask 應用或相似架構），環境邏輯集中在 `grid_logic.py`，前端資源則放於 `static/` 與 `templates/`。

**程式檔案說明**
- **`app.py`**: 應用進入點，啟動本地伺服器並處理前後端互動。
- **`grid_logic.py`**: 格子環境的主要邏輯（狀態、轉移、獎勵計算等）。
- **`templates/index.html`**: 前端 HTML 範本。
- **`static/script.js`**, **`static/style.css`**: 前端互動與樣式。
- **`Log.md`**: 開發或實驗紀錄。

**環境需求**
- Python 3.8 以上
- 建議使用虛擬環境（`venv` / `virtualenv`）

**快速上手**

1. 建議建立並啟用虛擬環境：

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

2. 安裝相依套件（若有 requirements）：

```bash
pip install -r requirements.txt
```

（若專案沒有 `requirements.txt`，請先以 `pip` 安裝 Flask 或其他需要的套件，例如 `flask`。）

3. 啟動應用：

```bash
python app.py
```

4. 在瀏覽器開啟：http://127.0.0.1:5000/ （或程式輸出顯示的位址）

**使用說明 / 功能概覽**
- 在網頁介面中可視覺化格子環境並觸發回合或動作。
- 若要修改環境邏輯，請編輯 `grid_logic.py`，並重新啟動伺服器測試變更。

**開發與除錯**
- 若要查看伺服器日誌或錯誤，直接在啟動的終端機查看 `app.py` 的輸出。
- 前端開發可直接編輯 `templates/index.html`、`static/script.js` 與 `static/style.css`，並於瀏覽器重新整理查看變更。

**檔案快速連結**
- [app.py](app.py)
- [grid_logic.py](grid_logic.py)
- [templates/index.html](templates/index.html)
- [static/script.js](static/script.js)
- [static/style.css](static/style.css)
- [Log.md](Log.md)

**聯絡 / 作者**

如需協助或有建議，請在專案中加入 issue 或直接聯絡專案維護者。