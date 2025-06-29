
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


const TILE_SIZE = 200;
const GAP = 50;
const TILE_SPACING = TILE_SIZE + GAP;
const playerRadius = 12;
const keyRadius = 8;
const maxHealth = 100;
const maxSystemHealth = 100;
const healthDepletionRate = 0.015;


let player = { x: 0, y: 0, speed: 30, keys: 0, health: maxHealth };
let systemHealth = maxSystemHealth;
let gameOver = false;

const baseStationTile = { col: 0, row: 0 };
const tileFeatures = new Map();
const keyMap = new Map();


function getTileKey(col, row) {
  return `${col},${row}`;
}


function getOrGenerateBlackTiles(col, row) {
  const key = getTileKey(col, row);
  if (tileFeatures.has(key)) return tileFeatures.get(key);

  const blackTiles = [];
  for (let i = 0; i < 5; i++) {
    const bw = 80, bh = 80;
    const scatterX = (Math.random() - 0.5) * 60;
    const scatterY = (Math.random() - 0.5) * 60;
    blackTiles.push({ bx: bw / 2 + scatterX, by: bh / 2 + scatterY, bw, bh });
  }
  tileFeatures.set(key, blackTiles);
  return blackTiles;
}


function getOrGenerateKeys(col, row) {
  const key = getTileKey(col, row);
  if (keyMap.has(key)) return keyMap.get(key);

  const keys = [];
  if (Math.random() < 0.2) {
    const blackTiles = getOrGenerateBlackTiles(col, row);

    for (let attempts = 0; attempts < 20; attempts++) {
      const x = Math.random() * TILE_SIZE;
      const y = Math.random() * TILE_SIZE;

      const overlaps = blackTiles.some(({ bx, by, bw, bh }) =>
        x + keyRadius > bx &&
        x - keyRadius < bx + bw &&
        y + keyRadius > by &&
        y - keyRadius < by + bh
      );

      if (!overlaps) {
        keys.push({ x, y, collected: false });
        break;
      }
    }
  }
  keyMap.set(key, keys);
  return keys;
}


function isCollidingWithBlackTile(newPlayerX, newPlayerY) {
  const cols = Math.ceil(canvas.width / TILE_SPACING) + 2;
  const rows = Math.ceil(canvas.height / TILE_SPACING) + 2;

  const offsetX = ((player.x % TILE_SPACING) + TILE_SPACING) % TILE_SPACING;
  const offsetY = ((player.y % TILE_SPACING) + TILE_SPACING) % TILE_SPACING;
  const startCol = Math.floor(player.x / TILE_SPACING);
  const startRow = Math.floor(player.y / TILE_SPACING);
  const playerScreenX = canvas.width / 2;
  const playerScreenY = canvas.height / 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const worldCol = startCol + col;
      const worldRow = startRow + row;
      const x = col * TILE_SPACING - offsetX;
      const y = row * TILE_SPACING - offsetY;

      const blackTiles = getOrGenerateBlackTiles(worldCol, worldRow);
      for (let { bx, by, bw, bh } of blackTiles) {
        const tileScreenX = x + bx;
        const tileScreenY = y + by;
        const playerFutureX = playerScreenX + (newPlayerX - player.x);
        const playerFutureY = playerScreenY + (newPlayerY - player.y);

        if (
          playerFutureX + playerRadius > tileScreenX &&
          playerFutureX - playerRadius < tileScreenX + bw &&
          playerFutureY + playerRadius > tileScreenY &&
          playerFutureY - playerRadius < tileScreenY + bh
        ) {
          return true;
        }
      }
    }
  }
  return false;
}



function drawStats() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Keys: ${player.keys}`, 20, 30);
}

function drawSystemHealth() {
  const barWidth = 200, barHeight = 20, x = 20, y = 60;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, (systemHealth / maxSystemHealth) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, barWidth, barHeight);
}

function drawPlayerHealth() {
  const barWidth = 200, barHeight = 20, x = 20, y = 90;
  ctx.fillStyle = "black";
  ctx.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
  ctx.fillStyle = "lime";
  ctx.fillRect(x, y, (player.health / maxHealth) * barWidth, barHeight);
  ctx.strokeStyle = "white";
  ctx.strokeRect(x, y, barWidth, barHeight);
}

function drawInfiniteTiles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cols = Math.ceil(canvas.width / TILE_SPACING) + 2;
  const rows = Math.ceil(canvas.height / TILE_SPACING) + 2;
  const offsetX = ((player.x % TILE_SPACING) + TILE_SPACING) % TILE_SPACING;
  const offsetY = ((player.y % TILE_SPACING) + TILE_SPACING) % TILE_SPACING;
  const startCol = Math.floor(player.x / TILE_SPACING);
  const startRow = Math.floor(player.y / TILE_SPACING);
  const playerScreenX = canvas.width / 2;
  const playerScreenY = canvas.height / 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const worldCol = startCol + col;
      const worldRow = startRow + row;
      const x = col * TILE_SPACING - offsetX;
      const y = row * TILE_SPACING - offsetY;


      ctx.fillStyle = (worldCol === baseStationTile.col && worldRow === baseStationTile.row) ? "cyan" : "#0f0";
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);


      getOrGenerateBlackTiles(worldCol, worldRow).forEach(({ bx, by, bw, bh }) => {
        ctx.fillStyle = "black";
        ctx.fillRect(x + bx, y + by, bw, bh);
      });


      getOrGenerateKeys(worldCol, worldRow).forEach((keyObj) => {
        if (keyObj.collected) return;

        const keyScreenX = x + keyObj.x;
        const keyScreenY = y + keyObj.y;

        ctx.fillStyle = "rgba(255, 105, 180, 1)";
        ctx.beginPath();
        ctx.arc(keyScreenX, keyScreenY, keyRadius, 0, Math.PI * 2);
        ctx.fill();

        const distance = Math.hypot(playerScreenX - keyScreenX, playerScreenY - keyScreenY);
        if (distance <= playerRadius + keyRadius) {
          keyObj.collected = true;
          player.keys += 1;
        }
      });


      const centerX = x + TILE_SIZE / 2;
      const centerY = y + TILE_SIZE / 2;
      const coneRadius = TILE_SIZE / 2 + GAP / 2;
      const now = performance.now() / 500;
      const angle = (now + worldCol * 0.3 + worldRow * 0.5) % (2 * Math.PI);
      const coneWidth = Math.PI / 6;

      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, coneRadius, angle - coneWidth / 2, angle + coneWidth / 2);
      ctx.closePath();
      ctx.fill();


      if (Math.hypot(playerScreenX - centerX, playerScreenY - centerY) < coneRadius) {
        const playerAngle = Math.atan2(playerScreenY - centerY, playerScreenX - centerX);
        const diff = Math.abs(((playerAngle - angle + Math.PI * 3) % (2 * Math.PI)) - Math.PI);
        if (diff < coneWidth / 2) {
          player.health -= 0.2;
          if (player.health <= 0) {
            player.health = 0;
            gameOver = true;
          }
        }
      }
    }
  }


  ctx.strokeStyle = "#0f0";
  for (let col = 0; col < cols; col++) {
    const x = col * TILE_SPACING - offsetX - GAP / 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let row = 0; row < rows; row++) {
    const y = row * TILE_SPACING - offsetY - GAP / 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }


  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(playerScreenX, playerScreenY, playerRadius, 0, Math.PI * 2);
  ctx.fill();

  drawSystemHealth();
  drawPlayerHealth();
  drawStats();
}



window.addEventListener("keydown", (e) => {
  let dx = 0, dy = 0;
  if (e.key === "ArrowUp") dy = -1;
  if (e.key === "ArrowDown") dy = 1;
  if (e.key === "ArrowLeft") dx = -1;
  if (e.key === "ArrowRight") dx = 1;

  for (let i = 0; i < player.speed; i++) {
    const newX = player.x + (dx !== 0 ? Math.sign(dx) : 0);
    const newY = player.y + (dy !== 0 ? Math.sign(dy) : 0);

    if (!isCollidingWithBlackTile(newX, player.y)) player.x = newX;
    if (!isCollidingWithBlackTile(player.x, newY)) player.y = newY;
  }
});


function update() {
  if (gameOver) {
    document.getElementById("status").textContent = "YOU DIED - GAME OVER";
    return;
  }

  drawInfiniteTiles();
  systemHealth -= healthDepletionRate;

  if (systemHealth <= 0) {
    systemHealth = 0;
    gameOver = true;
    document.getElementById("status").textContent = "SYSTEM FAILURE - GAME OVER";
  }

  document.getElementById("systemHealthDisplay").textContent = `${Math.floor(systemHealth)}%`;
  document.getElementById("playerHealthDisplay").textContent = `${Math.floor(player.health)}%`;
  document.getElementById("keysDisplay").textContent = player.keys;

  requestAnimationFrame(update);
}

update();
