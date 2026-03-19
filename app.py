from __future__ import annotations

import random
from typing import Dict, List, Optional, Set, Tuple

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

Action = str
State = Tuple[int, int]

ACTIONS: Dict[Action, Tuple[int, int]] = {
    "U": (-1, 0),
    "D": (1, 0),
    "L": (0, -1),
    "R": (0, 1),
}


def parse_point(raw: object, n: int, name: str) -> State:
    if not isinstance(raw, list) or len(raw) != 2:
        raise ValueError(f"{name} must be [row, col].")

    row, col = raw
    if not isinstance(row, int) or not isinstance(col, int):
        raise ValueError(f"{name} coordinates must be integers.")

    if row < 0 or row >= n or col < 0 or col >= n:
        raise ValueError(f"{name} is out of bounds.")

    return (row, col)


def parse_request_data(data: dict) -> Tuple[int, State, State, Set[State]]:
    n = data.get("n")
    if not isinstance(n, int) or n < 5 or n > 9:
        raise ValueError("n must be an integer between 5 and 9.")

    start = parse_point(data.get("start"), n, "start")
    end = parse_point(data.get("end"), n, "end")

    if start == end:
        raise ValueError("start and end cannot be the same cell.")

    raw_obstacles = data.get("obstacles")
    if not isinstance(raw_obstacles, list):
        raise ValueError("obstacles must be a list of points.")

    obstacles: Set[State] = set()
    for item in raw_obstacles:
        pt = parse_point(item, n, "obstacle")
        if pt in (start, end):
            raise ValueError("start/end cannot overlap with obstacles.")
        obstacles.add(pt)

    expected_obstacles = n - 2
    if len(obstacles) != expected_obstacles:
        raise ValueError(f"exactly {expected_obstacles} obstacles are required.")

    return n, start, end, obstacles


def is_inside(n: int, row: int, col: int) -> bool:
    return 0 <= row < n and 0 <= col < n


def next_state(n: int, state: State, action: Action, obstacles: Set[State]) -> State:
    d_row, d_col = ACTIONS[action]
    new_row = state[0] + d_row
    new_col = state[1] + d_col

    if not is_inside(n, new_row, new_col):
        return state

    candidate = (new_row, new_col)
    if candidate in obstacles:
        return state

    return candidate


def step_reward(s_next: State, end: State) -> float:
    if s_next == end:
        return 20.0
    return -1.0


def all_non_obstacle_states(n: int, obstacles: Set[State]) -> List[State]:
    states: List[State] = []
    for r in range(n):
        for c in range(n):
            s = (r, c)
            if s not in obstacles:
                states.append(s)
    return states


def valid_actions(n: int, state: State, obstacles: Set[State]) -> List[Action]:
    valid: List[Action] = []
    for action in ACTIONS:
        ns = next_state(n, state, action, obstacles)
        if ns != state:
            valid.append(action)

    if not valid:
        return list(ACTIONS.keys())
    return valid


def random_policy(n: int, end: State, obstacles: Set[State]) -> Dict[State, Optional[Action]]:
    policy: Dict[State, Optional[Action]] = {}

    for r in range(n):
        for c in range(n):
            s = (r, c)
            if s in obstacles or s == end:
                policy[s] = None
            else:
                policy[s] = random.choice(valid_actions(n, s, obstacles))

    return policy


def evaluate_policy(
    n: int,
    policy: Dict[State, Optional[Action]],
    end: State,
    obstacles: Set[State],
    gamma: float,
    theta: float,
    max_iterations: int,
) -> Tuple[Dict[State, float], int]:
    values: Dict[State, float] = {
        (r, c): 0.0 for r in range(n) for c in range(n) if (r, c) not in obstacles
    }

    values[end] = 0.0

    iteration = 0
    while iteration < max_iterations:
        delta = 0.0
        new_values = values.copy()

        for s in all_non_obstacle_states(n, obstacles):
            if s == end:
                continue

            action = policy.get(s)
            if action is None:
                continue

            ns = next_state(n, s, action, obstacles)
            reward = step_reward(ns, end)
            updated = reward + gamma * values[ns]
            delta = max(delta, abs(updated - values[s]))
            new_values[s] = updated

        values = new_values
        iteration += 1

        if delta < theta:
            break

    return values, iteration


def value_iteration(
    n: int,
    end: State,
    obstacles: Set[State],
    gamma: float,
    theta: float,
    max_iterations: int,
) -> Tuple[Dict[State, float], Dict[State, Optional[Action]], int]:
    values: Dict[State, float] = {
        (r, c): 0.0 for r in range(n) for c in range(n) if (r, c) not in obstacles
    }

    values[end] = 0.0

    iteration = 0
    while iteration < max_iterations:
        delta = 0.0
        new_values = values.copy()

        for s in all_non_obstacle_states(n, obstacles):
            if s == end:
                continue

            action_returns = []
            for action in ACTIONS:
                ns = next_state(n, s, action, obstacles)
                reward = step_reward(ns, end)
                action_returns.append(reward + gamma * values[ns])

            best_value = max(action_returns)
            delta = max(delta, abs(best_value - values[s]))
            new_values[s] = best_value

        values = new_values
        iteration += 1

        if delta < theta:
            break

    policy: Dict[State, Optional[Action]] = {}
    for r in range(n):
        for c in range(n):
            s = (r, c)
            if s in obstacles or s == end:
                policy[s] = None
                continue

            best_action: Optional[Action] = None
            best_score = float("-inf")

            for action in ACTIONS:
                ns = next_state(n, s, action, obstacles)
                reward = step_reward(ns, end)
                score = reward + gamma * values[ns]
                if score > best_score:
                    best_score = score
                    best_action = action

            policy[s] = best_action

    return values, policy, iteration


def to_grid_action_matrix(
    n: int,
    policy: Dict[State, Optional[Action]],
    start: State,
    end: State,
    obstacles: Set[State],
) -> List[List[str]]:
    matrix: List[List[str]] = []

    for r in range(n):
        row: List[str] = []
        for c in range(n):
            s = (r, c)
            if s in obstacles:
                row.append("X")
            elif s == start:
                row.append("S")
            elif s == end:
                row.append("E")
            else:
                row.append(policy.get(s) or "")
        matrix.append(row)

    return matrix


def to_grid_value_matrix(
    n: int,
    values: Dict[State, float],
    end: State,
    obstacles: Set[State],
) -> List[List[Optional[float]]]:
    matrix: List[List[Optional[float]]] = []

    for r in range(n):
        row: List[Optional[float]] = []
        for c in range(n):
            s = (r, c)
            if s in obstacles:
                row.append(None)
            elif s == end:
                row.append(0.0)
            else:
                row.append(round(values.get(s, 0.0), 2))
        matrix.append(row)

    return matrix


@app.get("/")
def index() -> str:
    return render_template("index.html")


@app.post("/api/random-policy")
def api_random_policy():
    try:
        data = request.get_json(silent=True) or {}
        n, start, end, obstacles = parse_request_data(data)

        gamma = float(data.get("gamma", 0.9))
        theta = float(data.get("theta", 1e-6))
        max_iterations = int(data.get("maxIterations", 1000))

        policy = random_policy(n, end, obstacles)
        values, iterations = evaluate_policy(
            n=n,
            policy=policy,
            end=end,
            obstacles=obstacles,
            gamma=gamma,
            theta=theta,
            max_iterations=max_iterations,
        )

        return jsonify(
            {
                "policy": to_grid_action_matrix(n, policy, start, end, obstacles),
                "values": to_grid_value_matrix(n, values, end, obstacles),
                "iterations": iterations,
                "gamma": gamma,
                "theta": theta,
            }
        )
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400


@app.post("/api/value-iteration")
def api_value_iteration():
    try:
        data = request.get_json(silent=True) or {}
        n, start, end, obstacles = parse_request_data(data)

        gamma = float(data.get("gamma", 0.9))
        theta = float(data.get("theta", 1e-6))
        max_iterations = int(data.get("maxIterations", 1000))

        values, policy, iterations = value_iteration(
            n=n,
            end=end,
            obstacles=obstacles,
            gamma=gamma,
            theta=theta,
            max_iterations=max_iterations,
        )

        return jsonify(
            {
                "policy": to_grid_action_matrix(n, policy, start, end, obstacles),
                "values": to_grid_value_matrix(n, values, end, obstacles),
                "iterations": iterations,
                "gamma": gamma,
                "theta": theta,
            }
        )
    except (ValueError, TypeError) as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(debug=True)
