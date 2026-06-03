/* Script.js - Principle of Moments (1 Pivot Middle - 2 Forces) */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const f1Range = document.getElementById('f1Range');
  const d1Range = document.getElementById('d1Range');
  const f2Range = document.getElementById('f2Range');
  const d2Range = document.getElementById('d2Range');

  const f1Val = document.getElementById('f1Val');
  const d1Val = document.getElementById('d1Val');
  const f2Val = document.getElementById('f2Val');
  const d2Val = document.getElementById('d2Val');

  const f1Control = document.getElementById('control-f1');
  const d1Control = document.getElementById('control-d1');
  const f2Control = document.getElementById('control-f2');
  const d2Control = document.getElementById('control-d2');

  const revealF1 = document.getElementById('reveal-f1');
  const revealD1 = document.getElementById('reveal-d1');
  const revealF2 = document.getElementById('reveal-f2');
  const revealD2 = document.getElementById('reveal-d2');

  const btnRandom = document.getElementById('btnRandom');
  const btnTest = document.getElementById('btnTest');
  const btnWorking = document.getElementById('btnWorking');
  const workingPanel = document.getElementById('workingPanel');
  const workingContent = document.getElementById('workingContent');
  const btnCloseWorking = document.getElementById('btnCloseWorking');

  const testModeBanner = document.getElementById('testModeBanner');
  const balanceBadge = document.getElementById('balanceBadge');
  const shapeDisplay = document.getElementById('shapeDisplay');
  const moment1Val = document.getElementById('moment1Val');
  const moment2Val = document.getElementById('moment2Val');
  
  const canvas = document.getElementById('physicsCanvas');
  const ctx = canvas.getContext('2d');

  // App State Variables
  let f1 = parseFloat(f1Range.value);
  let d1 = parseFloat(d1Range.value);
  let f2 = parseFloat(f2Range.value);
  let d2 = parseFloat(d2Range.value);
  
  let currentShape = 'Straight Beam'; // Options: 'Straight Beam', 'Arched Bridge', 'Zig-zag Truss', 'Wave Curved'
  let forceDirection = 1; // 1 = pointing down, -1 = pointing up
  
  // Test Mode State
  let testModeActive = false;
  let hiddenVariable = null; // 'f1', 'd1', 'f2', or 'd2'
  let variableRevealed = false;

  // Sound effects using Web Audio API
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  function playTickSound(freq = 440, duration = 0.05, type = 'sine') {
    try {
      initAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not permitted yet or not supported
    }
  }

  // Set up Canvas Dimension
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth * window.devicePixelRatio;
    canvas.height = container.clientHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Draw loop & physics modeling
  let angle = 0;
  let targetAngle = 0;
  
  function updatePhysics() {
    // Calculate Moments
    const m1 = f1 * d1; // Anti-clockwise torque when forces point DOWN, clockwise when forces point UP
    const m2 = f2 * d2; // Clockwise torque when forces point DOWN, anti-clockwise when forces point UP
    
    // Middle pivot layout:
    // Left side (f1, d1) moment is m1. Right side (f2, d2) moment is m2.
    // If forces point DOWN (forceDirection = 1):
    // - F1 pushes left side DOWN -> anti-clockwise rotation.
    // - F2 pushes right side DOWN -> clockwise rotation.
    // If forces point UP (forceDirection = -1):
    // - F1 pushes left side UP -> clockwise rotation.
    // - F2 pushes right side UP -> anti-clockwise rotation.
    
    let netMoment = 0;
    if (forceDirection === 1) {
      netMoment = m2 - m1; // Positive means clockwise tilt (down on right)
    } else {
      netMoment = m1 - m2; // Positive means clockwise tilt (up on right/down on left)
    }

    // Limit max tilt representation
    targetAngle = Math.min(Math.max(netMoment * 0.04, -0.25), 0.25);
    
    // Smooth angle interpolation
    angle += (targetAngle - angle) * 0.1;
    
    // Update Badge Status
    const isBalanced = Math.abs(m1 - m2) < 0.01;
    if (isBalanced) {
      balanceBadge.textContent = 'Balanced';
      balanceBadge.className = 'balance-badge balanced';
      balanceBadge.innerHTML = '<i class="fa-solid fa-scale-balanced"></i> Balanced';
    } else {
      balanceBadge.textContent = 'Unbalanced';
      balanceBadge.className = 'balance-badge unbalanced';
      balanceBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Unbalanced';
    }

    // Update moments text
    moment1Val.textContent = `${m1.toFixed(1)} N m`;
    moment2Val.textContent = `${m2.toFixed(1)} N m`;
  }

  function drawCanvas() {
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    // Grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 25;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const centerX = w / 2;
    const centerY = h / 2 + 30;
    const maxBeamLength = w * 0.4; // Max distance is 1.0 m (corresponds to maxBeamLength px)

    // Calculate positions
    const x1 = centerX - d1 * maxBeamLength;
    const x2 = centerX + d2 * maxBeamLength;

    // Draw Pivot Base (static, doesn't rotate)
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Pivot triangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, 45);
    ctx.lineTo(20, 45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Pivot center dot
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // Rotatable system Group
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Draw structure shapes based on current selection
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let pathColor = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';

    const startX = -maxBeamLength;
    const endX = maxBeamLength;

    ctx.beginPath();
    if (currentShape === 'Straight Beam') {
      ctx.moveTo(startX, 0);
      ctx.lineTo(endX, 0);
    } else if (currentShape === 'Arched Bridge') {
      ctx.moveTo(startX, 0);
      ctx.quadraticCurveTo(0, -60, endX, 0);
    } else if (currentShape === 'Zig-zag Truss') {
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX / 2, -30);
      ctx.lineTo(0, 0);
      ctx.lineTo(endX / 2, -30);
      ctx.lineTo(endX, 0);
    } else if (currentShape === 'Wave Curved') {
      ctx.moveTo(startX, 0);
      ctx.bezierCurveTo(startX / 2, -40, endX / 2, 40, endX, 0);
    }
    ctx.strokeStyle = pathColor;
    ctx.stroke();
    
    // Draw structural details (lines on beam, marks for meters)
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 0;
    for (let mark = 0.1; mark <= 1.0; mark += 0.1) {
      // Left marks
      const lmX = -mark * maxBeamLength;
      ctx.beginPath();
      ctx.moveTo(lmX, -5);
      ctx.lineTo(lmX, 5);
      ctx.stroke();
      
      // Right marks
      const rmX = mark * maxBeamLength;
      ctx.beginPath();
      ctx.moveTo(rmX, -5);
      ctx.lineTo(rmX, 5);
      ctx.stroke();
    }

    // Force 1 hook point
    const force1X = -d1 * maxBeamLength;
    let force1Y = 0;
    // Calculate Y offset on the structure curve
    if (currentShape === 'Arched Bridge') {
      // Quadratic curve interpolation y = a*x^2 + b*x + c. Here passing through (-max, 0), (0, -60), (max, 0)
      // curve equation: y = 60 * ((x/max)^2 - 1)
      const ratio = force1X / maxBeamLength;
      force1Y = 60 * (ratio * ratio - 1);
    } else if (currentShape === 'Zig-zag Truss') {
      if (force1X < startX / 2) {
        // Line from (-max, 0) to (-max/2, -30)
        const pct = (force1X - startX) / (startX / 2 - startX);
        force1Y = pct * -30;
      } else {
        // Line from (-max/2, -30) to (0, 0)
        const pct = force1X / (startX / 2);
        force1Y = pct * -30;
      }
    } else if (currentShape === 'Wave Curved') {
      // bezierCurveTo(startX/2, -40, endX/2, 40, endX, 0)
      // Approximate curve heights
      const pct = (force1X - startX) / (endX - startX);
      force1Y = (1 - pct) * 3 * pct * -40 + pct * 3 * (1 - pct) * 40;
    }

    // Force 2 hook point
    const force2X = d2 * maxBeamLength;
    let force2Y = 0;
    if (currentShape === 'Arched Bridge') {
      const ratio = force2X / maxBeamLength;
      force2Y = 60 * (ratio * ratio - 1);
    } else if (currentShape === 'Zig-zag Truss') {
      if (force2X < endX / 2) {
        // Line from (0,0) to (max/2, -30)
        const pct = force2X / (endX / 2);
        force2Y = pct * -30;
      } else {
        // Line from (max/2, -30) to (max, 0)
        const pct = (force2X - endX / 2) / (endX - endX / 2);
        force2Y = -30 + pct * 30;
      }
    } else if (currentShape === 'Wave Curved') {
      const pct = (force2X - startX) / (endX - startX);
      force2Y = (1 - pct) * 3 * pct * -40 + pct * 3 * (1 - pct) * 40;
    }

    // Draw hook dots
    ctx.beginPath();
    ctx.arc(force1X, force1Y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(force2X, force2Y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff007f';
    ctx.fill();

    // Draw Force Vectors
    const arrowLenF1 = 20 + f1 * 4;
    const arrowLenF2 = 20 + f2 * 4;

    // F1 Arrow
    drawArrow(force1X, force1Y, forceDirection, arrowLenF1, '#00f0ff', `F1: ${testModeActive && hiddenVariable === 'f1' && !variableRevealed ? '?' : f1 + ' N'}`);
    // F2 Arrow
    drawArrow(force2X, force2Y, forceDirection, arrowLenF2, '#ff007f', `F2: ${testModeActive && hiddenVariable === 'f2' && !variableRevealed ? '?' : f2 + ' N'}`);

    // Draw Distance lines labels
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    
    // d1 distance indicator line
    ctx.beginPath();
    ctx.moveTo(force1X, force1Y);
    ctx.lineTo(force1X, 60);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(force1X, 50);
    ctx.lineTo(0, 50);
    ctx.stroke();
    
    // Label for d1
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 11px Orbitron';
    ctx.textAlign = 'center';
    const textD1 = testModeActive && hiddenVariable === 'd1' && !variableRevealed ? 'd1: ?' : `d1: ${d1.toFixed(1)}m`;
    ctx.fillText(textD1, force1X / 2, 45);

    // d2 distance indicator line
    ctx.beginPath();
    ctx.moveTo(force2X, force2Y);
    ctx.lineTo(force2X, 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(force2X, 50);
    ctx.stroke();

    // Label for d2
    ctx.fillStyle = '#ff007f';
    const textD2 = testModeActive && hiddenVariable === 'd2' && !variableRevealed ? 'd2: ?' : `d2: ${d2.toFixed(1)}m`;
    ctx.fillText(textD2, force2X / 2, 45);

    ctx.restore();
  }

  function drawArrow(x, y, direction, length, color, label) {
    ctx.save();
    ctx.translate(x, y);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    const arrowY = direction * length;

    // Stem
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, arrowY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(0, arrowY);
    ctx.lineTo(-8, arrowY - direction * 10);
    ctx.lineTo(8, arrowY - direction * 10);
    ctx.closePath();
    ctx.fill();

    // Label text
    ctx.shadowBlur = 0;
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, arrowY + (direction === 1 ? 15 : -10));

    ctx.restore();
  }

  // Animation Frame Loop
  function tick() {
    updatePhysics();
    drawCanvas();
    requestAnimationFrame(tick);
  }
  tick();

  // Change sliders handling
  function updateSliderOutputs() {
    f1Val.textContent = testModeActive && hiddenVariable === 'f1' && !variableRevealed ? '?' : `${f1} N`;
    d1Val.textContent = testModeActive && hiddenVariable === 'd1' && !variableRevealed ? '?' : `${d1.toFixed(1)} m`;
    f2Val.textContent = testModeActive && hiddenVariable === 'f2' && !variableRevealed ? '?' : `${f2} N`;
    d2Val.textContent = testModeActive && hiddenVariable === 'd2' && !variableRevealed ? '?' : `${d2.toFixed(1)} m`;
  }

  function handleSliderInput(e) {
    if (testModeActive) return; // Prevent manipulation of sliders directly in test mode
    
    f1 = parseFloat(f1Range.value);
    d1 = parseFloat(d1Range.value);
    f2 = parseFloat(f2Range.value);
    d2 = parseFloat(d2Range.value);

    updateSliderOutputs();
    playTickSound(350 + (f1 + f2) * 10, 0.03);
  }

  f1Range.addEventListener('input', handleSliderInput);
  d1Range.addEventListener('input', handleSliderInput);
  f2Range.addEventListener('input', handleSliderInput);
  d2Range.addEventListener('input', handleSliderInput);

  // Randomise Action
  const shapes = ['Straight Beam', 'Arched Bridge', 'Zig-zag Truss', 'Wave Curved'];
  btnRandom.addEventListener('click', () => {
    // Pick a random shape
    currentShape = shapes[Math.floor(Math.random() * shapes.length)];
    shapeDisplay.textContent = `Shape: ${currentShape}`;
    
    // Pick direction of force (up or down)
    forceDirection = Math.random() < 0.5 ? 1 : -1;

    // Pick balanced randomized variables
    // Formula F1 * d1 = F2 * d2
    // Let's choose random values for F1, d1, d2, then solve for F2
    // To keep F2 within 1 to 20 N step 1, we can search for combinations that produce integer solutions.
    let validCombination = false;
    let attempts = 0;
    
    while (!validCombination && attempts < 100) {
      attempts++;
      const randF1 = Math.floor(Math.random() * 20) + 1; // 1 to 20
      const randD1 = Math.round((Math.random() * 0.9 + 0.1) * 10) / 10; // 0.1 to 1.0
      const randD2 = Math.round((Math.random() * 0.9 + 0.1) * 10) / 10; // 0.1 to 1.0
      
      const calcF2 = (randF1 * randD1) / randD2;
      const roundedF2 = Math.round(calcF2);

      // Check if rounded F2 satisfies the equilibrium, is within bounds, and has precision steps
      if (roundedF2 >= 1 && roundedF2 <= 20 && Math.abs(randF1 * randD1 - roundedF2 * randD2) < 0.001) {
        f1 = randF1;
        d1 = randD1;
        f2 = roundedF2;
        d2 = randD2;
        validCombination = true;
      }
    }

    if (!validCombination) {
      // Fallback defaults
      f1 = 10;
      d1 = 0.6;
      f2 = 12;
      d2 = 0.5;
    }

    // Set slider positions
    f1Range.value = f1;
    d1Range.value = d1;
    f2Range.value = f2;
    d2Range.value = d2;

    updateSliderOutputs();
    playTickSound(600, 0.15, 'triangle');
    
    // Hide the working panel
    workingPanel.classList.add('hidden');

    // If in Test Mode, randomize the hidden variable as well and reset styling
    if (testModeActive) {
      variableRevealed = false;
      const vars = ['f1', 'd1', 'f2', 'd2'];
      hiddenVariable = vars[Math.floor(Math.random() * vars.length)];

      f1Control.classList.toggle('obscured', hiddenVariable === 'f1');
      d1Control.classList.toggle('obscured', hiddenVariable === 'd1');
      f2Control.classList.toggle('obscured', hiddenVariable === 'f2');
      d2Control.classList.toggle('obscured', hiddenVariable === 'd2');

      revealF1.classList.toggle('hidden', hiddenVariable !== 'f1');
      revealD1.classList.toggle('hidden', hiddenVariable !== 'd1');
      revealF2.classList.toggle('hidden', hiddenVariable !== 'f2');
      revealD2.classList.toggle('hidden', hiddenVariable !== 'd2');

      [revealF1, revealD1, revealF2, revealD2].forEach(btn => {
        btn.classList.remove('revealed');
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      });

      updateSliderOutputs();
    }
  });

  // Test Mode Action
  btnTest.addEventListener('click', () => {
    testModeActive = !testModeActive;
    variableRevealed = false;
    
    if (testModeActive) {
      // Enter Test Mode
      btnTest.innerHTML = '<i class="fa-solid fa-ban"></i> Exit Test';
      btnTest.classList.add('active');
      testModeBanner.classList.remove('hidden');
      btnWorking.classList.remove('hidden');
      
      // Hide working panel initially
      workingPanel.classList.add('hidden');

      // Randomise variables to guarantee balanced state first, which also picks the hidden variable
      btnRandom.click();

      playTickSound(700, 0.2, 'sawtooth');
    } else {
      // Exit Test Mode
      btnTest.innerHTML = '<i class="fa-solid fa-graduation-cap"></i> Test Mode';
      btnTest.classList.remove('active');
      testModeBanner.classList.add('hidden');
      btnWorking.classList.add('hidden');
      workingPanel.classList.add('hidden');

      // Reset blurred states and reveal buttons
      [f1Control, d1Control, f2Control, d2Control].forEach(c => c.classList.remove('obscured'));
      [revealF1, revealD1, revealF2, revealD2].forEach(b => b.classList.add('hidden'));

      hiddenVariable = null;
      updateSliderOutputs();
      playTickSound(400, 0.1, 'sine');
    }
  });

  // Reveal Answer triggers
  const revealButtons = [
    { btn: revealF1, key: 'f1' },
    { btn: revealD1, key: 'd1' },
    { btn: revealF2, key: 'f2' },
    { btn: revealD2, key: 'd2' }
  ];

  revealButtons.forEach(item => {
    item.btn.addEventListener('click', () => {
      variableRevealed = !variableRevealed;
      
      if (variableRevealed) {
        item.btn.classList.add('revealed');
        item.btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        // Un-blur the value text
        if (item.key === 'f1') f1Control.classList.remove('obscured');
        if (item.key === 'd1') d1Control.classList.remove('obscured');
        if (item.key === 'f2') f2Control.classList.remove('obscured');
        if (item.key === 'd2') d2Control.classList.remove('obscured');
        playTickSound(520, 0.1);
      } else {
        item.btn.classList.remove('revealed');
        item.btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        // Re-blur the value text
        if (item.key === 'f1') f1Control.classList.add('obscured');
        if (item.key === 'd1') d1Control.classList.add('obscured');
        if (item.key === 'f2') f2Control.classList.add('obscured');
        if (item.key === 'd2') d2Control.classList.add('obscured');
        playTickSound(350, 0.1);
      }
      updateSliderOutputs();
    });
  });

  // Generate Step-by-Step Working Markup
  function generateWorking() {
    let workingHTML = '';
    
    // Identify clockwise and anticlockwise components based on forceDirection
    // middle pivot -> forceDirection = 1 (DOWN) => left force = ACW, right force = CW
    // forceDirection = -1 (UP) => left force = CW, right force = ACW
    let leftMomentDir = forceDirection === 1 ? 'Anticlockwise' : 'Clockwise';
    let rightMomentDir = forceDirection === 1 ? 'Clockwise' : 'Anticlockwise';

    const leftTerm = `F₁ × d₁`;
    const rightTerm = `F₂ × d₂`;

    workingHTML += `
      <div class="working-step">
        <span class="step-num">Step 1</span>
        <div class="step-details">
          Identify the directions of the moments about the pivot:
          <ul>
            <li>Force <strong>F₁</strong> (${f1} N) is at distance <strong>d₁</strong> (${d1.toFixed(1)} m) on the left. Since the force is pointing ${forceDirection === 1 ? 'DOWN' : 'UP'}, it generates an <strong>${leftMomentDir} moment</strong>.</li>
            <li>Force <strong>F₂</strong> (${f2} N) is at distance <strong>d₂</strong> (${d2.toFixed(1)} m) on the right. Since the force is pointing ${forceDirection === 1 ? 'DOWN' : 'UP'}, it generates a <strong>${rightMomentDir} moment</strong>.</li>
          </ul>
        </div>
      </div>
      
      <div class="working-step">
        <span class="step-num">Step 2</span>
        <div class="step-details">
          State the Principle of Moments formula for dynamic equilibrium (balance):
          <br>
          <span class="formula-highlight">Total Anticlockwise Moment = Total Clockwise Moment</span>
          <br>
          For this middle-pivot system:
          <br>
          <span class="formula-highlight">${leftMomentDir === 'Anticlockwise' ? 'F₁ × d₁' : 'F₂ × d₂'} = ${leftMomentDir === 'Anticlockwise' ? 'F₂ × d₂' : 'F₁ × d₁'}</span>
        </div>
      </div>
    `;

    // Calculate details based on which variable is hidden
    if (hiddenVariable === 'f1') {
      workingHTML += `
        <div class="working-step">
          <span class="step-num">Step 3</span>
          <div class="step-details">
            Substitute the known values (d₁ = ${d1.toFixed(1)} m, F₂ = ${f2} N, d₂ = ${d2.toFixed(1)} m) into the equilibrium equation:
            <br>
            <span class="formula-highlight">F₁ × ${d1.toFixed(1)} m = ${f2} N × ${d2.toFixed(1)} m</span>
          </div>
        </div>
        <div class="working-step">
          <span class="step-num">Step 4</span>
          <div class="step-details">
            Solve for the unknown force <strong>F₁</strong>:
            <br>
            <span class="formula-highlight">F₁ = (${f2} × ${d2.toFixed(1)}) / ${d1.toFixed(1)}</span>
            <br>
            <span class="formula-highlight">F₁ = ${(f2 * d2).toFixed(2)} / ${d1.toFixed(1)} = <strong>${f1} N</strong></span>
          </div>
        </div>
      `;
    } else if (hiddenVariable === 'd1') {
      workingHTML += `
        <div class="working-step">
          <span class="step-num">Step 3</span>
          <div class="step-details">
            Substitute the known values (F₁ = ${f1} N, F₂ = ${f2} N, d₂ = ${d2.toFixed(1)} m) into the equilibrium equation:
            <br>
            <span class="formula-highlight">${f1} N × d₁ = ${f2} N × ${d2.toFixed(1)} m</span>
          </div>
        </div>
        <div class="working-step">
          <span class="step-num">Step 4</span>
          <div class="step-details">
            Solve for the unknown distance <strong>d₁</strong>:
            <br>
            <span class="formula-highlight">d₁ = (${f2} × ${d2.toFixed(1)}) / ${f1}</span>
            <br>
            <span class="formula-highlight">d₁ = ${(f2 * d2).toFixed(2)} / ${f1} = <strong>${d1.toFixed(1)} m</strong></span>
          </div>
        </div>
      `;
    } else if (hiddenVariable === 'f2') {
      workingHTML += `
        <div class="working-step">
          <span class="step-num">Step 3</span>
          <div class="step-details">
            Substitute the known values (F₁ = ${f1} N, d₁ = ${d1.toFixed(1)} m, d₂ = ${d2.toFixed(1)} m) into the equilibrium equation:
            <br>
            <span class="formula-highlight">${f1} N × ${d1.toFixed(1)} m = F₂ × ${d2.toFixed(1)} m</span>
          </div>
        </div>
        <div class="working-step">
          <span class="step-num">Step 4</span>
          <div class="step-details">
            Solve for the unknown force <strong>F₂</strong>:
            <br>
            <span class="formula-highlight">F₂ = (${f1} × ${d1.toFixed(1)}) / ${d2.toFixed(1)}</span>
            <br>
            <span class="formula-highlight">F₂ = ${(f1 * d1).toFixed(2)} / ${d2.toFixed(1)} = <strong>${f2} N</strong></span>
          </div>
        </div>
      `;
    } else if (hiddenVariable === 'd2') {
      workingHTML += `
        <div class="working-step">
          <span class="step-num">Step 3</span>
          <div class="step-details">
            Substitute the known values (F₁ = ${f1} N, d₁ = ${d1.toFixed(1)} m, F₂ = ${f2} N) into the equilibrium equation:
            <br>
            <span class="formula-highlight">${f1} N × ${d1.toFixed(1)} m = ${f2} N × d₂</span>
          </div>
        </div>
        <div class="working-step">
          <span class="step-num">Step 4</span>
          <div class="step-details">
            Solve for the unknown distance <strong>d₂</strong>:
            <br>
            <span class="formula-highlight">d₂ = (${f1} × ${d1.toFixed(1)}) / ${f2}</span>
            <br>
            <span class="formula-highlight">d₂ = ${(f1 * d1).toFixed(2)} / ${f2} = <strong>${d2.toFixed(1)} m</strong></span>
          </div>
        </div>
      `;
    }

    workingContent.innerHTML = workingHTML;
  }

  btnWorking.addEventListener('click', () => {
    generateWorking();
    workingPanel.classList.remove('hidden');
    workingPanel.scrollIntoView({ behavior: 'smooth' });
    playTickSound(450, 0.15);
  });

  btnCloseWorking.addEventListener('click', () => {
    workingPanel.classList.add('hidden');
    playTickSound(300, 0.08);
  });
});
