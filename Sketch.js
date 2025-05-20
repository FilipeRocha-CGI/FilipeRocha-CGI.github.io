
let bee;
let flowers = [];
let score = 0;
let lives = 3;
let gameState = "start"; // "start", "playing", "gameOver"

// --- Initial Difficulty & Game Parameters ---
let initialMaxFlowers = 10;
let initialFlowerSpawnInterval = 90; // Frames (e.g., 1.5 seconds at 60FPS)

let initialMaxHazards = 3;
let initialHazardSpawnInterval = 150; // Frames (e.g., 2.5 seconds)

// --- Current Difficulty Parameters (modified during gameplay) ---
let currentMaxFlowers;
let currentFlowerSpawnInterval;
let lastFlowerSpawnTime = 0;

let currentMaxHazards;
let currentHazardSpawnInterval;
let hazardSpeedMultiplier;
let lastHazardSpawnTime = 0;

// --- Difficulty Scaling Controls ---
let scorePerDifficultyIncrease = 4; // Increase difficulty every X points
let lastDifficultyUpdateScore = 0;

let minHazardSpawnInterval = 45;    // Fastest spawn rate for hazards
let maxHazardsCap = 7;              // Maximum number of hazards on screen
let maxHazardSpeedMultiplier = 1.8; // Max speed increase for hazards
let maxFlowersCap = 13;             // Max flowers on screen at high difficulty


// --- Bee Class ---
class Bee {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.wingSize = this.size * 0.7;
    this.wingAngle = 0;
    this.wingSpeed = 0.4;

    this.isHit = false;
    this.hitTimer = 0;
  }

  update() {
    // Smoothly follow mouse
    this.x = lerp(this.x, mouseX, 0.1);
    this.y = lerp(this.y, mouseY, 0.1);

    // Keep bee within canvas bounds
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);

    // Wing animation
    this.wingAngle += this.wingSpeed;
  }

  display() {
    push();
    translate(this.x, this.y);

    let currentAlpha = 100; // HSB alpha is 0-100
    if (this.isHit) {
      this.hitTimer--;
      if (this.hitTimer <= 0) {
        this.isHit = false;
      }
      // Flicker effect by varying alpha
      currentAlpha = (frameCount % 10 < 5) ? 40 : 90;
    }

    // Wings (flapping)
    fill(200, 20, 100, currentAlpha * 0.6); // Light blueish-white, semi-transparent
    noStroke();
    let currentWingY = sin(this.wingAngle) * (this.size * 0.15); // Flap amplitude
    ellipse(-this.size * 0.45, currentWingY - this.wingSize * 0.1, this.wingSize, this.wingSize * 0.5); // Left wing
    ellipse(this.size * 0.45, currentWingY - this.wingSize * 0.1, this.wingSize, this.wingSize * 0.5);  // Right wing

    // Body
    fill(50, 100, 100, currentAlpha); // Yellow
    stroke(0, 0, 0, currentAlpha); // Black stroke
    strokeWeight(1);
    ellipse(0, 0, this.size * 0.9, this.size); // Main body (more oval)

    // Stripes
    fill(0, 0, 10, currentAlpha); // Darker black for stripes
    noStroke();
    rectMode(CENTER);
    rect(0, -this.size * 0.2, this.size * 0.8, this.size * 0.15);
    rect(0, this.size * 0.1, this.size * 0.8, this.size * 0.15);
    
    // Eyes
    fill(0, 0, 0, currentAlpha);
    ellipse(-this.size * 0.15, -this.size * 0.3, this.size * 0.15, this.size * 0.15);
    ellipse(this.size * 0.15, -this.size * 0.3, this.size * 0.15, this.size * 0.15);

    pop();
  }

  intersects(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    return d < this.size / 2 + other.size / 2;
  }

  hit() {
    if (!this.isHit) { // Only trigger if not already hit
      this.isHit = true;
      this.hitTimer = 45; // Flash for ~0.75 seconds
    }
  }
}

// --- Flower Class ---
class Flower {
  constructor(x, y) {
    this.x = x || random(20, width - 20);
    this.y = y || random(20, height - 20);
    this.size = random(25, 45);
    // Hues for flowers: Pinks, Oranges, Purples
    let flowerHues = [random(300, 360), random(0, 30), random(270, 300)];
    this.petalColor = color(random(flowerHues), 80, 90); 
    this.centerColor = color(50, 90, 100); // Yellowish center
    this.hasPollen = true;
    this.collectedTime = -1; 
    this.fadeDuration = 60; // 1 second fade
  }

  display() {
    if (!this.hasPollen && frameCount - this.collectedTime > this.fadeDuration) {
      return; 
    }

    push();
    translate(this.x, this.y);
    
    let currentAlpha = 100; // HSB alpha 0-100
    if (!this.hasPollen) {
      currentAlpha = map(frameCount - this.collectedTime, 0, this.fadeDuration, 100, 0);
    }

    // Petals
    noStroke();
    fill(hue(this.petalColor), saturation(this.petalColor), brightness(this.petalColor), currentAlpha);
    for (let i = 0; i < 6; i++) { // 6 petals
      rotate(TWO_PI / 6);
      ellipse(0, this.size * 0.35, this.size * 0.4, this.size * 0.7);
    }
    
    // Center
    if (this.hasPollen) {
      fill(hue(this.centerColor), saturation(this.centerColor), brightness(this.centerColor), currentAlpha);
    } else {
      fill(hue(this.centerColor), saturation(this.centerColor) * 0.5, brightness(this.centerColor) * 0.8, currentAlpha); // Dull center
    }
    ellipse(0, 0, this.size * 0.5, this.size * 0.5);
    
    pop();
  }

  collectPollen() {
    if (this.hasPollen) {
      this.hasPollen = false;
      this.collectedTime = frameCount;
      score++;
      return true;
    }
    return false;
  }

  isFaded() {
    return !this.hasPollen && frameCount - this.collectedTime > this.fadeDuration;
  }
}

// --- Hazard Class (Pests) ---
class Hazard {
  constructor(speedMult = 1) {
    this.size = random(25, 40);
    // Spawn from any edge
    if (random(1) < 0.5) { // Spawn from left or right
        this.x = random(1) < 0.5 ? -this.size : width + this.size; // Start off-screen left or right
        this.y = random(height); // Random y position
        this.vx = (this.x < 0) ? random(1, 2.5) * speedMult : random(-2.5, -1) * speedMult; // Speed towards canvas center
        this.vy = random(-0.5, 0.5) * speedMult; // Slight vertical drift
    } else { // Spawn from top or bottom
        this.x = random(width); // Random x position
        this.y = random(1) < 0.5 ? -this.size : height + this.size; // Start off-screen top or bottom
        this.vx = random(-0.5, 0.5) * speedMult; // Slight horizontal drift
        this.vy = (this.y < 0) ? random(1, 2.5) * speedMult : random(-2.5, -1) * speedMult; // Speed towards canvas center
    }
    this.color = color(0, 90, 70); // Red for pest
    this.rotation = 0;
    this.rotationSpeed = random(-0.03, 0.03);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    fill(this.color);
    noStroke();
    // Spiky shape
    beginShape();
    for (let i = 0; i < 8; i++) {
        let angle = map(i, 0, 8, 0, TWO_PI);
        let r = (i % 2 === 0) ? this.size / 1.8 : this.size / 2.5;
        vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    pop();
  }

  isOffscreen() {
    return (
      this.x < -this.size * 2 || this.x > width + this.size * 2 ||
      this.y < -this.size * 2 || this.y > height + this.size * 2
    );
  }
}

// --- P5.js Main Functions ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100); // Hue, Sat, Bright, Alpha (0-100)
  textFont('Arial'); // A common font
  
  bee = new Bee(width / 2, height / 2);
  initializeGameVariables(); // This will also set up initial difficulty params
  gameState = "start";
}

function initializeGameVariables() {
  score = 0;
  lives = 3;
  flowers = [];
  hazards = [];
  
  // Reset bee
  bee.isHit = false;
  bee.x = width / 2;
  bee.y = height / 2;

  // Reset difficulty parameters
  currentMaxFlowers = initialMaxFlowers;
  currentFlowerSpawnInterval = initialFlowerSpawnInterval;
  currentMaxHazards = initialMaxHazards;
  currentHazardSpawnInterval = initialHazardSpawnInterval;
  hazardSpeedMultiplier = 1.0;
  lastDifficultyUpdateScore = 0; // Reset for difficulty scaling

  lastFlowerSpawnTime = frameCount;
  lastHazardSpawnTime = frameCount;
  
  for (let i = 0; i < 5; i++) { // Start with a few flowers
    flowers.push(new Flower());
  }
}

function updateDifficulty() {
  // Update difficulty only when score has increased past the last update point
  // Or if it's the first point scored (lastDifficultyUpdateScore would be 0)
  if (score > lastDifficultyUpdateScore && (score % scorePerDifficultyIncrease === 0 || (score === 1 && lastDifficultyUpdateScore === 0) ) ) {
    lastDifficultyUpdateScore = score; // Update the score at which difficulty was last changed

    // Increase hazard spawn rate (decrease interval)
    currentHazardSpawnInterval = max(minHazardSpawnInterval, currentHazardSpawnInterval * 0.92);

    // Increase max hazards
    if (currentMaxHazards < maxHazardsCap) {
      currentMaxHazards = min(maxHazardsCap, currentMaxHazards + 0.4); // Increment can be fractional
    }

    // Increase hazard speed
    hazardSpeedMultiplier = min(maxHazardSpeedMultiplier, hazardSpeedMultiplier * 1.04);
    
    // Increase max flowers slightly
    if (currentMaxFlowers < maxFlowersCap) {
        currentMaxFlowers = min(maxFlowersCap, currentMaxFlowers + 0.2);
    }
    // Optional: Slightly decrease flower spawn interval (more flowers)
    // currentFlowerSpawnInterval = max(70, currentFlowerSpawnInterval * 0.98); 

    // console.log(`Diff Upd: Score ${score}, HInt ${currentHazardSpawnInterval.toFixed(1)}, MaxH ${Math.floor(currentMaxHazards)}, HSpd ${hazardSpeedMultiplier.toFixed(2)}, MaxF ${Math.floor(currentMaxFlowers)}`);
  }
}


function draw() {
  background(110, 50, 95); // Light, earthy green background

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    runGame();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();
  }
}

function runGame() {
  updateDifficulty(); // Check and update difficulty levels

  // Spawn Flowers
  if (frameCount - lastFlowerSpawnTime > currentFlowerSpawnInterval && flowers.length < Math.floor(currentMaxFlowers)) {
    flowers.push(new Flower());
    lastFlowerSpawnTime = frameCount;
  }

  // Spawn Hazards
  if (frameCount - lastHazardSpawnTime > currentHazardSpawnInterval && hazards.length < Math.floor(currentMaxHazards)) {
    hazards.push(new Hazard(hazardSpeedMultiplier)); // Pass current speed multiplier
    lastHazardSpawnTime = frameCount;
  }

  // Update and display flowers
  for (let i = flowers.length - 1; i >= 0; i--) {
    flowers[i].display();
    if (bee.intersects(flowers[i]) && flowers[i].hasPollen) {
      flowers[i].collectPollen();
    }
    if (flowers[i].isFaded()) {
      flowers.splice(i, 1);
    }
  }
  
  // Update and display hazards
  for (let i = hazards.length - 1; i >= 0; i--) {
    hazards[i].update();
    hazards[i].display();
    if (bee.intersects(hazards[i])) {
      if (!bee.isHit) { // Only lose a life if not currently in hit cooldown
        lives--;
        bee.hit(); // Trigger visual hit effect
      }
      hazards.splice(i, 1); // Remove hazard on collision
      if (lives <= 0) {
        gameState = "gameOver";
      }
    } else if (hazards[i].isOffscreen()) {
      hazards.splice(i, 1);
    }
  }

  // Update and display bee
  bee.update();
  bee.display();

  drawUI();
}

function drawUI() {
  fill(0, 0, 100); // White text
  noStroke();
  textSize(22);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  
  // Draw hearts for lives
  let heartSize = 20;
  for(let i=0; i<lives; i++) {
    drawHeart(width - 30 - (i * (heartSize + 5)), 30, heartSize);
  }
  
  textAlign(CENTER, TOP);
  textSize(18);
  fill(50, 80, 90); // Yellowish
  text("Happy World Bee Day!", width / 2, 20);
}

function drawHeart(x, y, size) {
    push();
    translate(x,y);
    fill(0, 90, 90); // Red heart
    noStroke();
    beginShape();
    vertex(0, size * 0.25);
    bezierVertex(-size * 0.5, -size * 0.15, -size * 0.3, -size * 0.5, 0, -size * 0.2);
    bezierVertex(size * 0.3, -size * 0.5, size * 0.5, -size * 0.15, 0, size * 0.25);
    endShape(CLOSE);
    pop();
}


function drawStartScreen() {
  background(110, 50, 85); // Slightly darker background for start
  fill(50, 90, 100); // Yellow
  textAlign(CENTER, CENTER);
  textSize(48);
  text("Pollen Patrol", width / 2, height / 3);
  
  textSize(24);
  fill(0, 0, 100); // White
  text("Help the bee collect pollen from flowers!", width / 2, height / 2 - 20);
  text("Avoid the red pests!", width / 2, height / 2 + 10);
  
  textSize(28);
  fill(55, 100, 100); // Bright Yellow
  text("Click to Start", width / 2, height / 2 + 70);

  // Draw a sample bee and flower.
  // We need to create temporary instances here if bee is not yet fully initialized or
  // to avoid modifying the main game 'bee' instance.
  // Using the main bee instance is fine if it's already created in setup().
  let tempBeeX = width / 2 - 100;
  let tempBeeY = height * 0.7;
  // Display a generic bee representation for the start screen
  push();
  translate(tempBeeX, tempBeeY);
  fill(50, 100, 100); ellipse(0,0,30,30); // Simple yellow body
  fill(200, 20, 100, 50); ellipse(-15, -5, 20, 10); ellipse(15, -5, 20, 10); // Simple wings
  pop();

  let sampleFlower = new Flower(width / 2 + 100, height * 0.7); sampleFlower.display();
}

function drawGameOverScreen() {
  // Draw current game state slightly dimmed
  // To do this without actually running game logic, we just draw the elements as they were
  for (let flower of flowers) flower.display();
  for (let hazard of hazards) hazard.display();
  bee.display();
  drawUI(); // Draw score and lives one last time over the "paused" game

  fill(0, 0, 0, 40); // Semi-transparent black overlay
  rect(0, 0, width, height);

  fill(0, 100, 100); // Red
  textAlign(CENTER, CENTER);
  textSize(64);
  text("Game Over!", width / 2, height / 2 - 60);
  
  fill(0, 0, 100); // White
  textSize(36);
  text("Final Score: " + score, width / 2, height / 2 + 10);
  
  textSize(28);
  fill(55, 100, 100); // Bright Yellow
  text("Click to Restart", width / 2, height / 2 + 70);
}

function mousePressed() {
  if (gameState === "start" || gameState === "gameOver") {
    initializeGameVariables();
    gameState = "playing";
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // If UI elements are hard-positioned, they might need updates here
  // For this game, most elements are dynamic or relative, so it's mostly fine.
  if (gameState === "start" || gameState === "gameOver") {
    // Re-center bee if on start/game over screens and not actively playing
     if (bee) { // Make sure bee exists before trying to access its properties
        bee.x = width / 2;
        bee.y = height / 2;
     }
  }
}
