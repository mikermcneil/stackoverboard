// Memoized per worldSeed (the maze never changes for a given world).
var memo = { seed: undefined, maze: undefined };

const MIN_X = -3;
const MAX_X = 3;
const MIN_Y = 7;
const MAX_Y = 11;
const DIRS = {
  up: { dx: 0, dy: -1, opposite: 'down' },
  down: { dx: 0, dy: 1, opposite: 'up' },
  left: { dx: -1, dy: 0, opposite: 'right' },
  right: { dx: 1, dy: 0, opposite: 'left' },
};

module.exports = {


  friendlyName: 'Generate maze',


  description: 'Generate (or return the memoized) deterministic maze for the Below, from the world seed.',


  extendedDescription:
`Grid: x in [-3..3], y in [7..11] (y grows deeper; "up" is y-1).  A seeded randomized DFS
spanning tree from the entrance (0,7), plus a few extra loops.  The entrance opens up to
the trench floor; the goal cell (somewhere on y=11) opens down to the octopus garden.`,


  sync: true,


  inputs: {},


  exits: {

    success: {
      outputType: 'ref',
      outputDescription: '`{ cells: { "x,y": { x, y, openings, exitTo, isEntrance, isGoal, hint, memory, distanceToGoal } }, goal: {x,y}, entrance: {x,y} }`.  Do not mutate.'
    },

  },


  fn: function () {

    var worldSeed = sails.config.custom.worldSeed;
    if (memo.seed === worldSeed && memo.maze) {
      return memo.maze;
    }

    var rng = sails.helpers.world.rng(`${worldSeed}:maze`);
    var k = (x, y) => `${x},${y}`;
    var inBounds = (x, y) => x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y;
    var cells = {};
    for (let y = MIN_Y; y <= MAX_Y; y++) {
      for (let x = MIN_X; x <= MAX_X; x++) {
        cells[k(x, y)] = {
          x, y,
          openings: { up: false, down: false, left: false, right: false },
          exitTo: {},
          isEntrance: false,
          isGoal: false,
          hint: 'down',
          memory: null,
          distanceToGoal: null,
        };
      }
    }
    var connect = (cell, dir) => {
      var d = DIRS[dir];
      cell.openings[dir] = true;
      cells[k(cell.x + d.dx, cell.y + d.dy)].openings[d.opposite] = true;
    };

    // Randomized DFS spanning tree from the entrance.
    var entrance = cells[k(0, MIN_Y)];
    var visited = { [k(0, MIN_Y)]: true };
    var stack = [entrance];
    while (stack.length) {
      let cell = stack[stack.length - 1];
      let options = Object.keys(DIRS).filter((dir) => {
        let nx = cell.x + DIRS[dir].dx;
        let ny = cell.y + DIRS[dir].dy;
        return inBounds(nx, ny) && !visited[k(nx, ny)];
      });
      if (!options.length) {
        stack.pop();
        continue;
      }
      let dir = options[Math.floor(rng() * options.length)];
      connect(cell, dir);
      let next = cells[k(cell.x + DIRS[dir].dx, cell.y + DIRS[dir].dy)];
      visited[k(next.x, next.y)] = true;
      stack.push(next);
    }//∞

    // A few extra connections, so it's not a perfect maze.
    for (let y = MIN_Y; y <= MAX_Y; y++) {
      for (let x = MIN_X; x <= MAX_X; x++) {
        let cell = cells[k(x, y)];
        for (let dir of ['right', 'down']) {
          let nx = x + DIRS[dir].dx;
          let ny = y + DIRS[dir].dy;
          if (inBounds(nx, ny) && !cell.openings[dir] && rng() < 0.12) {
            connect(cell, dir);
          }
        }
      }
    }

    // Entrance & goal.
    entrance.isEntrance = true;
    entrance.openings.up = true;
    entrance.exitTo.up = 'trench-floor';
    var goal = cells[k(MIN_X + Math.floor(rng() * (MAX_X - MIN_X + 1)), MAX_Y)];
    goal.isGoal = true;
    goal.openings.down = true;
    goal.exitTo.down = 'undershine-gate';

    // BFS distances (staying inside the grid).
    var bfs = (start) => {
      var dist = { [k(start.x, start.y)]: 0 };
      var queue = [start];
      while (queue.length) {
        let cell = queue.shift();
        for (let dir of Object.keys(DIRS)) {
          let nx = cell.x + DIRS[dir].dx;
          let ny = cell.y + DIRS[dir].dy;
          if (cell.openings[dir] && inBounds(nx, ny) && dist[k(nx, ny)] === undefined) {
            dist[k(nx, ny)] = dist[k(cell.x, cell.y)] + 1;
            queue.push(cells[k(nx, ny)]);
          }
        }
      }
      return dist;
    };

    var fromGoal = bfs(goal);
    for (let key of Object.keys(cells)) {
      let cell = cells[key];
      cell.distanceToGoal = fromGoal[key];
      if (cell.isGoal) {
        cell.hint = 'down';
        continue;
      }
      for (let dir of ['down', 'left', 'right', 'up']) {
        let nx = cell.x + DIRS[dir].dx;
        let ny = cell.y + DIRS[dir].dy;
        if (cell.openings[dir] && inBounds(nx, ny) && fromGoal[k(nx, ny)] === fromGoal[key] - 1) {
          cell.hint = dir;
          break;
        }
      }
    }

    // Three "memory" (flashback) cells: at least 2 steps from the entrance, spread out by
    // distance from the entrance (memory 1 nearest, memory 3 farthest).
    var fromEntrance = bfs(entrance);
    var candidates = Object.keys(cells)
    .filter((key) => fromEntrance[key] >= 2 && !cells[key].isGoal)
    .sort((a, b) => (fromEntrance[a] - fromEntrance[b]) || (a < b ? -1 : 1));
    var third = candidates.length / 3;
    for (let i = 0; i < 3; i++) {
      let lo = Math.floor(i * third);
      let hi = Math.max(lo + 1, Math.floor((i + 1) * third));
      let pick = candidates[lo + Math.floor(rng() * (hi - lo))];
      cells[pick].memory = i + 1;
    }

    var maze = { cells, goal: { x: goal.x, y: goal.y }, entrance: { x: 0, y: MIN_Y } };
    memo = { seed: worldSeed, maze };
    return maze;

  }


};
