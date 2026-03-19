# DRL HW1 - Grid World (Flask)

This project implements all required parts:

- HW1-1: interactive n x n grid map (n from 5 to 9)
- HW1-2: random policy display and policy evaluation for V(s)
- HW1-3: value iteration for optimal policy and updated value function

## Features

- User-defined grid size from 5 to 9
- Mouse-click setup workflow:
  - Set Start cell (green)
  - Set End cell (red)
  - Toggle obstacles (gray), exactly n-2 cells
- Random policy generation (U, D, L, R)
- Iterative policy evaluation for random policy
- Value iteration for optimal policy
- Side-by-side visualization:
  - Policy matrix
  - Value function matrix V(s)
- Adjustable algorithm parameters:
  - discount factor gamma
  - convergence threshold theta

## Project Structure

.
- app.py
- requirements.txt
- templates/
  - index.html
- static/
  - style.css
  - app.js

## Environment

- Python 3.10+
- Flask 3.1.0

## Installation

1. Create and activate a virtual environment (recommended).
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the app:

```bash
python app.py
```

4. Open browser:

```text
http://127.0.0.1:5000
```

## Usage Flow

1. Set grid size (5-9), click Generate Grid.
2. Select mode:
   - Set Start
   - Set End
   - Toggle Obstacle
3. Click cells to configure:
   - one Start
   - one End
   - exactly n-2 obstacles
4. Click Random Policy + Evaluation:
   - Random action in each valid state
   - Policy evaluation computes V(s)
5. Click Run Value Iteration:
   - Compute optimal value function
   - Replace random policy with optimal actions

## MDP and Algorithm Details

### State Space

- All grid cells except obstacles are valid states.
- End cell is terminal.

### Action Space

- 4 deterministic actions: U, D, L, R
- If action would go out of bounds or into obstacle, agent stays in same state.

### Reward Design

- Step reward: -1 for non-terminal transitions
- Entering End: +20
- Terminal End state value fixed at 0 in output matrix

### Policy Evaluation

Given a fixed policy pi(s), values are updated by:

V(s) <- R(s, pi(s)) + gamma * V(s')

until max update difference < theta.

### Value Iteration

Values are updated by:

V(s) <- max_a [ R(s, a) + gamma * V(s') ]

until convergence. Then the best action at each state forms the optimal policy.

## Input Validation Rules

- n must be integer in [5, 9]
- Start and End must both be set
- Start and End cannot overlap
- Obstacles cannot overlap Start/End
- Number of obstacles must be exactly n-2

## Suggested Demo Settings

- n = 5
- gamma = 0.90
- theta = 0.000001
- obstacle count = 3

## Notes for Grading

- Function completeness:
  - interactive grid construction
  - random policy and value evaluation
  - value iteration and optimal policy rendering
- UI friendliness:
  - clear operation modes
  - immediate status updates and error prompts
- Code readability:
  - backend algorithm utilities are modularized
  - frontend logic is split into rendering, validation, and API calls

## Optional Improvements

- Add stochastic transition model
- Add heatmap coloring for V(s)
- Export current map and results to JSON
- Add animation for following a policy path
