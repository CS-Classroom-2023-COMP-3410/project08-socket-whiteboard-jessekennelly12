document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('whiteboard');
  const context = canvas.getContext('2d');
  const colorInput = document.getElementById('color-input');
  const brushSizeInput = document.getElementById('brush-size');
  const brushSizeDisplay = document.getElementById('brush-size-display');
  const clearButton = document.getElementById('clear-button');
  const connectionStatus = document.getElementById('connection-status');
  const userCount = document.getElementById('user-count');

  // Keep a local copy of the board state so we can redraw on resize
  let currentBoardState = [];

  function resizeCanvas() {
    // TODO: Set the canvas width and height based on its parent element
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Redraw the canvas with the current board state when resized
    // TODO: Call redrawCanvas() function
    redrawCanvas(currentBoardState);
  }

  // Initialize canvas size
  // TODO: Call resizeCanvas()
  resizeCanvas();

  // Handle window resize
  // TODO: Add an event listener for the 'resize' event that calls resizeCanvas
  window.addEventListener('resize', resizeCanvas);

  // Drawing variables
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Connect to Socket.IO server
  // TODO: Create a socket connection to the server at 'http://localhost:3000'
  // IMPORTANT: In the browser, socket.io-client is loaded via a <script> tag,
  // so use the global `io` (do NOT use require()).
  const socket = io('http://localhost:3000');

  socket.on('connect', () => {
    // TODO: Set up Socket.IO event handlers
    console.log('Connected to server');
    if (connectionStatus) connectionStatus.textContent = 'Connected';
  });

  socket.on('disconnect', () => {
    if (connectionStatus) connectionStatus.textContent = 'Disconnected';
  });

  // --- Socket events coming FROM the server ---
  socket.on('currentUsers', (count) => {
    if (userCount) userCount.textContent = String(count);
  });

  socket.on('boardState', (boardState = []) => {
    currentBoardState = boardState;
    redrawCanvas(currentBoardState);
  });

  socket.on('draw', (data) => {
    // Store it locally so resizes can redraw
    currentBoardState.push(data);
    drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
  });

  socket.on('clear', () => {
    currentBoardState = [];
    redrawCanvas(currentBoardState);
  });

  // Canvas event handlers
  // TODO: Add event listeners for mouse events (mousedown, mousemove, mouseup, mouseout)
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch support (optional)
  // TODO: Add event listeners for touch events (touchstart, touchmove, touchend, touchcancel)
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchcancel', stopDrawing);

  // Clear button event handler
  // TODO: Add event listener for the clear button
  clearButton.addEventListener('click', clearCanvas);

  // Update brush size display
  // TODO: Add event listener for brush size input changes
  function updateBrushSizeDisplay() {
    if (brushSizeDisplay) brushSizeDisplay.textContent = String(brushSizeInput.value);
  }
  brushSizeInput.addEventListener('input', updateBrushSizeDisplay);
  updateBrushSizeDisplay();

  function startDrawing(e) {
    // TODO: Set isDrawing to true and capture initial coordinates
    isDrawing = true;
    const { x, y } = getCoordinates(e);
    lastX = x;
    lastY = y;
  }

  function draw(e) {
    // TODO: If not drawing, return
    if (!isDrawing) return;

    // TODO: Get current coordinates
    const { x, y } = getCoordinates(e);

    // TODO: Emit 'draw' event to the server with drawing data
    // NOTE: Do NOT draw locally here. We only draw when the server broadcasts 'draw'
    const color = colorInput.value;
    const size = Number(brushSizeInput.value);

    socket.emit('draw', {
      x0: lastX,
      y0: lastY,
      x1: x,
      y1: y,
      color,
      size,
    });

    // TODO: Update last position
    lastX = x;
    lastY = y;
  }

  function drawLine(x0, y0, x1, y1, color, size) {
    // TODO: Draw a line on the canvas using the provided parameters
    context.strokeStyle = color;
    context.lineWidth = size;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.stroke();
  }

  function stopDrawing() {
    // TODO: Set isDrawing to false
    isDrawing = false;
  }

  function clearCanvas() {
    // TODO: Emit 'clear' event to the server
    socket.emit('clear');
  }

  function redrawCanvas(boardState = []) {
    // TODO: Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // TODO: Redraw all lines from the board state
    for (const seg of boardState) {
      drawLine(seg.x0, seg.y0, seg.x1, seg.y1, seg.color, seg.size);
    }
  }

  // Helper function to get coordinates from mouse or touch event
  function getCoordinates(e) {
    // TODO: Extract coordinates from the event (for both mouse and touch events)
    // HINT: For touch events, use e.touches[0] or e.changedTouches[0]
    // HINT: For mouse events, use e.offsetX and e.offsetY

    const rect = canvas.getBoundingClientRect();

    // Touch
    if (e.touches && e.touches[0]) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    if (e.changedTouches && e.changedTouches[0]) {
      const t = e.changedTouches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }

    // Mouse
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Handle touch events
  function handleTouchStart(e) {
    // TODO: Prevent default behavior and call startDrawing
    e.preventDefault();
    startDrawing(e);
  }

  function handleTouchMove(e) {
    // TODO: Prevent default behavior and call draw
    e.preventDefault();
    draw(e);
  }
});