"""
grid_logic.py
核心邏輯模組：MDP 網格、策略評估、價值迭代
"""

import random
import math

# 行動定義
ACTIONS = ['up', 'down', 'left', 'right']
ACTION_SYMBOLS = {
    'up': '↑',
    'down': '↓',
    'left': '←',
    'right': '→',
    'terminal': '★',
    'obstacle': '■'
}

# 移動方向
MOVE_DELTA = {
    'up':    (-1, 0),
    'down':  ( 1, 0),
    'left':  ( 0,-1),
    'right': ( 0, 1),
}

GAMMA = 0.9        # 折扣因子
REWARD_GOAL = 10.0  # 到達終點的獎勵
REWARD_STEP = -0.1  # 每步懲罰
THETA = 1e-6        # 收斂閾值


def generate_random_policy(n, start, goal, obstacles):
    """為每個可行狀態隨機生成一個動作"""
    policy = {}
    obstacle_set = set(map(tuple, obstacles))
    for r in range(n):
        for c in range(n):
            cell = (r, c)
            if cell == tuple(goal):
                policy[cell] = 'terminal'
            elif cell in obstacle_set:
                policy[cell] = 'obstacle'
            else:
                policy[cell] = random.choice(ACTIONS)
    return policy


def get_next_state(n, state, action, obstacles):
    """根據當前狀態和動作計算下一狀態（碰牆則留原地）"""
    obstacle_set = set(map(tuple, obstacles))
    dr, dc = MOVE_DELTA[action]
    r, c = state
    nr, nc = r + dr, c + dc
    if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in obstacle_set:
        return (nr, nc)
    return state  # 碰牆留原地


def policy_evaluation(n, policy, start, goal, obstacles, gamma=GAMMA, theta=THETA):
    """
    策略評估：給定策略，反覆更新 V(s) 直到收斂
    返回 {(r,c): value} 字典
    """
    obstacle_set = set(map(tuple, obstacles))
    goal_tuple = tuple(goal)

    # 初始化所有格子價值為 0
    V = {}
    for r in range(n):
        for c in range(n):
            V[(r, c)] = 0.0

    max_iterations = 1000
    for iteration in range(max_iterations):
        delta = 0.0
        new_V = dict(V)
        for r in range(n):
            for c in range(n):
                state = (r, c)
                if state in obstacle_set:
                    continue
                if state == goal_tuple:
                    new_V[state] = REWARD_GOAL
                    continue

                action = policy.get(state, random.choice(ACTIONS))
                if action in ('terminal', 'obstacle'):
                    continue

                next_state = get_next_state(n, state, action, obstacles)
                reward = REWARD_GOAL if next_state == goal_tuple else REWARD_STEP
                new_value = reward + gamma * V[next_state]
                delta = max(delta, abs(new_value - V[state]))
                new_V[state] = new_value

        V = new_V
        if delta < theta:
            break

    return V


def value_iteration(n, start, goal, obstacles, gamma=GAMMA, theta=THETA):
    """
    價值迭代：計算最佳策略和最佳價值函數
    返回 (optimal_policy, optimal_V)
    """
    obstacle_set = set(map(tuple, obstacles))
    goal_tuple = tuple(goal)

    # 初始化
    V = {}
    for r in range(n):
        for c in range(n):
            V[(r, c)] = 0.0

    max_iterations = 10000
    for iteration in range(max_iterations):
        delta = 0.0
        new_V = dict(V)
        for r in range(n):
            for c in range(n):
                state = (r, c)
                if state in obstacle_set:
                    continue
                if state == goal_tuple:
                    new_V[state] = REWARD_GOAL
                    continue

                action_values = []
                for action in ACTIONS:
                    next_state = get_next_state(n, state, action, obstacles)
                    reward = REWARD_GOAL if next_state == goal_tuple else REWARD_STEP
                    action_values.append(reward + gamma * V[next_state])

                best_value = max(action_values)
                delta = max(delta, abs(best_value - V[state]))
                new_V[state] = best_value

        V = new_V
        if delta < theta:
            break

    # 從最佳 V 提取最佳策略
    optimal_policy = {}
    for r in range(n):
        for c in range(n):
            state = (r, c)
            if state == goal_tuple:
                optimal_policy[state] = 'terminal'
            elif state in obstacle_set:
                optimal_policy[state] = 'obstacle'
            else:
                best_action = None
                best_val = -math.inf
                for action in ACTIONS:
                    next_state = get_next_state(n, state, action, obstacles)
                    reward = REWARD_GOAL if next_state == goal_tuple else REWARD_STEP
                    val = reward + gamma * V[next_state]
                    if val > best_val:
                        best_val = val
                        best_action = action
                optimal_policy[state] = best_action

    return optimal_policy, V


def serialize_policy(policy):
    """將 policy dict 轉成可 JSON 序列化的格式 {\"r,c\": action}"""
    return {f"{r},{c}": action for (r, c), action in policy.items()}


def serialize_values(V):
    """將 V dict 轉成可 JSON 序列化的格式 {\"r,c\": value}"""
    return {f"{r},{c}": round(v, 3) for (r, c), v in V.items()}
