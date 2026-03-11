"""
app.py
Flask 主應用程式 — 網格地圖 MDP 作業 HW1
"""

from flask import Flask, render_template, request, jsonify, session
import secrets
import json
from grid_logic import (
    generate_random_policy,
    policy_evaluation,
    value_iteration,
    serialize_policy,
    serialize_values,
    ACTION_SYMBOLS,
)

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)


# ──────────────────────────────────────────────
# 路由
# ──────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/init', methods=['POST'])
def api_init():
    """初始化網格，回傳空網格資訊"""
    data = request.get_json()
    n = int(data.get('n', 5))
    n = max(5, min(9, n))  # 限制範圍 5~9

    session['n'] = n
    session['start'] = None
    session['goal'] = None
    session['obstacles'] = []
    session['phase'] = 'setup'   # setup → random_policy → value_iteration

    return jsonify({'status': 'ok', 'n': n})


@app.route('/api/set_cell', methods=['POST'])
def api_set_cell():
    """設定格子類型：start / goal / obstacle / clear"""
    data = request.get_json()
    r = int(data['r'])
    c = int(data['c'])
    cell_type = data['type']  # 'start' | 'goal' | 'obstacle' | 'clear'

    n = session.get('n', 5)
    start = session.get('start')
    goal = session.get('goal')
    obstacles = session.get('obstacles', [])

    # 驗證範圍
    if not (0 <= r < n and 0 <= c < n):
        return jsonify({'status': 'error', 'message': '座標超出範圍'}), 400

    cell = [r, c]

    # 清除該格之前的角色
    if start == cell:
        session['start'] = None
        start = None
    if goal == cell:
        session['goal'] = None
        goal = None
    if cell in obstacles:
        obstacles.remove(cell)

    max_obstacles = n - 2

    if cell_type == 'start':
        session['start'] = cell
    elif cell_type == 'goal':
        session['goal'] = cell
    elif cell_type == 'obstacle':
        if len(obstacles) >= max_obstacles:
            return jsonify({'status': 'error',
                            'message': f'障礙物上限為 {max_obstacles} 個'}), 400
        obstacles.append(cell)
        session['obstacles'] = obstacles
    elif cell_type == 'clear':
        pass  # 已於上方清除

    session['obstacles'] = obstacles

    return jsonify({
        'status': 'ok',
        'start': session.get('start'),
        'goal': session.get('goal'),
        'obstacles': session.get('obstacles', []),
        'obstacle_count': len(session.get('obstacles', [])),
        'max_obstacles': max_obstacles,
    })


@app.route('/api/random_policy', methods=['POST'])
def api_random_policy():
    """HW1-2：生成隨機策略並執行策略評估，回傳策略與 V(s)"""
    n = session.get('n')
    start = session.get('start')
    goal = session.get('goal')
    obstacles = session.get('obstacles', [])

    if n is None or start is None or goal is None:
        return jsonify({'status': 'error', 'message': '請先設定起點與終點'}), 400

    policy = generate_random_policy(n, start, goal, obstacles)
    V = policy_evaluation(n, policy, start, goal, obstacles)

    # 加入箭頭符號供顯示
    policy_symbols = {k: ACTION_SYMBOLS.get(v, v) for k, v in policy.items()}

    session['phase'] = 'random_policy'

    return jsonify({
        'status': 'ok',
        'policy': serialize_policy(policy),
        'policy_symbols': {f"{r},{c}": ACTION_SYMBOLS.get(a, a)
                           for (r, c), a in policy.items()},
        'values': serialize_values(V),
    })


@app.route('/api/value_iteration', methods=['POST'])
def api_value_iteration():
    """HW1-3：執行價值迭代，回傳最佳策略與 V(s)"""
    n = session.get('n')
    start = session.get('start')
    goal = session.get('goal')
    obstacles = session.get('obstacles', [])

    if n is None or start is None or goal is None:
        return jsonify({'status': 'error', 'message': '請先設定起點與終點'}), 400

    optimal_policy, optimal_V = value_iteration(n, start, goal, obstacles)

    session['phase'] = 'value_iteration'

    return jsonify({
        'status': 'ok',
        'policy': serialize_policy(optimal_policy),
        'policy_symbols': {f"{r},{c}": ACTION_SYMBOLS.get(a, a)
                           for (r, c), a in optimal_policy.items()},
        'values': serialize_values(optimal_V),
    })


@app.route('/api/state', methods=['GET'])
def api_state():
    """回傳目前 session 狀態"""
    return jsonify({
        'n': session.get('n'),
        'start': session.get('start'),
        'goal': session.get('goal'),
        'obstacles': session.get('obstacles', []),
        'phase': session.get('phase', 'setup'),
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
