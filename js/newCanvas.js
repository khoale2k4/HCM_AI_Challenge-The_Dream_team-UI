// New Canvas System with Grid Coordinates
class CanvasManager {
    constructor(canvasId, containerId) {
        this.canvasId = canvasId;
        this.containerId = containerId;
        this.canvas = null;
        this.gridSize = { width: 7, height: 7 }; // 7x7 grid (a-g, 1-7)
        this.cellSize = { width: 39, height: 22 }; // 275/7, 154/7
        this.objects = new Map(); // Store objects with grid coordinates
        this.history = []; // Store canvas states for undo
        this.maxHistory = 20; // Maximum number of states to keep
        
        this.init();
    }
    
    init() {
        // Create Fabric.js canvas
        this.canvas = new fabric.Canvas(this.canvasId, {
            width: 275,
            height: 154,
            selection: true,
            uniScaleTransform: true
        });
        
        // Draw grid
        this.drawGrid();
        
        // Bind events
        this.bindEvents();
        
        // Create control buttons
        this.createControlButtons();
        
        // Save initial state
        this.saveState();
        
        console.log(`Canvas ${this.canvasId} initialized with grid system`);
    }
    
    drawGrid() {
        // Draw vertical lines (a-g)
        for (let i = 1; i < this.gridSize.width; i++) {
            const x = i * this.cellSize.width;
            this.canvas.add(new fabric.Line([x, 0, x, this.canvas.height], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
                selectable: false,
                evented: false
            }));
        }
        
        // Draw horizontal lines (1-7)
        for (let i = 1; i < this.gridSize.height; i++) {
            const y = i * this.cellSize.height;
            this.canvas.add(new fabric.Line([0, y, this.canvas.width, y], {
                stroke: '#e0e0e0',
                strokeWidth: 1,
                selectable: false,
                evented: false
            }));
        }
        
        // Add grid labels
        this.addGridLabels();
    }
    
    addGridLabels() {
        // Add column labels (a-g)
        for (let i = 0; i < this.gridSize.width; i++) {
            const x = i * this.cellSize.width + this.cellSize.width / 2;
            const y = 8;
            const label = new fabric.Text(String.fromCharCode(97 + i), {
                left: x,
                top: y,
                fontSize: 10,
                fill: '#666',
                selectable: false,
                evented: false
            });
            this.canvas.add(label);
        }
        
        // Add row labels (1-7)
        for (let i = 0; i < this.gridSize.height; i++) {
            const x = 8;
            const y = i * this.cellSize.height + this.cellSize.height / 2;
            const label = new fabric.Text((i + 1).toString(), {
                left: x,
                top: y,
                fontSize: 10,
                fill: '#666',
                selectable: false,
                evented: false
            });
            this.canvas.add(label);
        }
    }
    
    bindEvents() {
        // Object selection events
        this.canvas.on('selection:created', (e) => {
            console.log('Object selected:', e.selected);
            this.updateObjectInfo(e.selected[0]);
        });
        
        this.canvas.on('selection:cleared', (e) => {
            console.log('Selection cleared');
            this.clearObjectInfo();
        });
        
        // Object modification events
        this.canvas.on('object:modified', (e) => {
            console.log('Object modified:', e.target);
            this.updateObjectPosition(e.target);
            this.saveState();
        });
        
        this.canvas.on('object:moving', (e) => {
            this.updateObjectPosition(e.target);
        });
        
        // Mouse events for debugging
        this.canvas.on('mouse:down', (e) => {
            if (e.target) {
                console.log('Clicked on object:', e.target);
                console.log('Object grid position:', this.getGridPosition(e.target));
            }
        });
    }
    
    // Convert pixel coordinates to grid coordinates
    pixelToGrid(x, y) {
        const col = Math.floor(x / this.cellSize.width);
        const row = Math.floor(y / this.cellSize.height);
        
        // Ensure coordinates are within bounds
        const boundedCol = Math.max(0, Math.min(col, this.gridSize.width - 1));
        const boundedRow = Math.max(0, Math.min(row, this.gridSize.height - 1));
        
        return {
            col: boundedCol,
            row: boundedRow,
            colLabel: String.fromCharCode(97 + boundedCol), // a-g
            rowLabel: (boundedRow + 1).toString() // 1-7
        };
    }
    
    // Convert grid coordinates to pixel coordinates (center of cell)
    gridToPixel(col, row) {
        return {
            x: col * this.cellSize.width + this.cellSize.width / 2,
            y: row * this.cellSize.height + this.cellSize.height / 2
        };
    }
    
    // Get grid position of an object (center point)
    getGridPosition(obj) {
        const centerX = obj.left + (obj.width * obj.scaleX) / 2;
        const centerY = obj.top + (obj.height * obj.scaleY) / 2;
        return this.pixelToGrid(centerX, centerY);
    }
    
    // Get all grid cells that an object covers
    getObjectGridCells(obj) {
        const cells = [];
        
        // Get object bounds
        const left = obj.left;
        const top = obj.top;
        const right = left + (obj.width * obj.scaleX);
        const bottom = top + (obj.height * obj.scaleY);
        
        // Convert corners to grid coordinates
        const topLeft = this.pixelToGrid(left, top);
        const topRight = this.pixelToGrid(right, top);
        const bottomLeft = this.pixelToGrid(left, bottom);
        const bottomRight = this.pixelToGrid(right, bottom);
        
        // Get range of grid cells
        const minCol = Math.min(topLeft.col, topRight.col, bottomLeft.col, bottomRight.col);
        const maxCol = Math.max(topLeft.col, topRight.col, bottomLeft.col, bottomRight.col);
        const minRow = Math.min(topLeft.row, topRight.row, bottomLeft.row, bottomRight.row);
        const maxRow = Math.max(topLeft.row, topRight.row, bottomLeft.row, bottomRight.row);
        
        // Add all cells in the range
        for (let col = minCol; col <= maxCol; col++) {
            for (let row = minRow; row <= maxRow; row++) {
                const cellPos = {
                    col: col,
                    row: row,
                    colLabel: String.fromCharCode(97 + col),
                    rowLabel: (row + 1).toString()
                };
                cells.push(cellPos);
            }
        }
        
        return cells;
    }
    
    // Get object dimensions in pixels
    getObjectDimensions(obj) {
        return {
            width: obj.width * obj.scaleX,
            height: obj.height * obj.scaleY,
            left: obj.left,
            top: obj.top,
            right: obj.left + (obj.width * obj.scaleX),
            bottom: obj.top + (obj.height * obj.scaleY)
        };
    }
    
    // Get object dimensions in grid cells
    getObjectGridDimensions(obj) {
        const cells = this.getObjectGridCells(obj);
        if (cells.length === 0) return null;
        
        const cols = [...new Set(cells.map(cell => cell.col))].sort((a, b) => a - b);
        const rows = [...new Set(cells.map(cell => cell.row))].sort((a, b) => a - b);
        
        return {
            width: cols.length,
            height: rows.length,
            minCol: cols[0],
            maxCol: cols[cols.length - 1],
            minRow: rows[0],
            maxRow: rows[rows.length - 1],
            cells: cells
        };
    }
    
    // Add object to canvas at specific grid position
    addObjectAtGrid(imageSrc, col, row, objectId) {
        const pixelPos = this.gridToPixel(col, row);
        
        fabric.Image.fromURL(imageSrc, (img) => {
            // Scale image to fit cell
            const scale = Math.min(
                this.cellSize.width * 0.8 / img.width,
                this.cellSize.height * 0.8 / img.height
            );
            
            img.set({
                left: pixelPos.x - (img.width * scale) / 2,
                top: pixelPos.y - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                lockMovementX: false,
                lockMovementY: false,
                transparentCorners: false,
                cornerColor: 'rgba(102,153,255,0.8)',
                cornerSize: 8,
                cornerStyle: 'circle',
                borderColor: 'rgba(102,153,255,0.8)',
                borderScaleFactor: 1,
                objectId: objectId,
                gridPosition: { col, row }
            });
            
            this.canvas.add(img);
            this.objects.set(objectId, img);
            
            // Update object info
            this.updateObjectInfo(img);
            
            // Save state after adding object
            this.saveState();
            
            console.log(`Object ${objectId} added at grid position ${String.fromCharCode(97 + col)}${row + 1}`);
        });
    }
    
    // Add object at mouse position (for drag & drop)
    addObjectAtPosition(imageSrc, mouseX, mouseY, objectId) {
        // Create object at exact mouse position, not snapped to grid
        fabric.Image.fromURL(imageSrc, (img) => {
            // Scale image to fit cell
            const scale = Math.min(
                this.cellSize.width * 0.8 / img.width,
                this.cellSize.height * 0.8 / img.height
            );
            
            img.set({
                left: mouseX - (img.width * scale) / 2,
                top: mouseY - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                lockMovementX: false,
                lockMovementY: false,
                transparentCorners: false,
                cornerColor: 'rgba(102,153,255,0.8)',
                cornerSize: 8,
                cornerStyle: 'circle',
                borderColor: 'rgba(102,153,255,0.8)',
                borderScaleFactor: 1,
                objectId: objectId
            });
            
            this.canvas.add(img);
            this.objects.set(objectId, img);
            
            // Update object info
            this.updateObjectInfo(img);
            
            // Save state after adding object
            this.saveState();
            
            console.log(`Object ${objectId} added at position (${mouseX}, ${mouseY})`);
        });
    }
    
    // Add object at specific pixel position
    addObjectAtPixel(imageSrc, pixelX, pixelY, objectId) {
        fabric.Image.fromURL(imageSrc, (img) => {
            // Scale image to fit cell
            const scale = Math.min(
                this.cellSize.width * 0.8 / img.width,
                this.cellSize.height * 0.8 / img.height
            );
            
            img.set({
                left: pixelX - (img.width * scale) / 2,
                top: pixelY - (img.height * scale) / 2,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                lockMovementX: false,
                lockMovementY: false,
                transparentCorners: false,
                cornerColor: 'rgba(102,153,255,0.8)',
                cornerSize: 8,
                cornerStyle: 'circle',
                borderColor: 'rgba(102,153,255,0.8)',
                borderScaleFactor: 1,
                objectId: objectId
            });
            
            this.canvas.add(img);
            this.objects.set(objectId, img);
            
            // Update object info
            this.updateObjectInfo(img);
            
            // Save state after adding object
            this.saveState();
            
            console.log(`Object ${objectId} added at pixel position (${pixelX}, ${pixelY})`);
        });
    }
    
    // Update object position when moved
    updateObjectPosition(obj) {
        // Don't snap to grid, just update info
        const gridPos = this.getGridPosition(obj);
        obj.gridPosition = gridPos;
        
        this.canvas.requestRenderAll();
        this.updateObjectInfo(obj);
    }
    
    // Update object info display
    updateObjectInfo(obj) {
        const gridPos = this.getGridPosition(obj);
        const pixelX = Math.round(obj.left + (obj.width * obj.scaleX) / 2);
        const pixelY = Math.round(obj.top + (obj.height * obj.scaleY) / 2);
        const info = `Object: ${obj.objectId} | Pixel: (${pixelX}, ${pixelY}) | Grid: ${gridPos.colLabel}${gridPos.rowLabel}`;
        console.log(info);
        
        // Update info display if exists
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            infoElement.textContent = info;
        }
    }
    
    // Clear object info display
    clearObjectInfo() {
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            infoElement.textContent = 'No object selected';
        }
    }
    
    // Get all objects with their positions
    getAllObjects() {
        const result = [];
        this.objects.forEach((obj, id) => {
            const gridPos = this.getGridPosition(obj);
            const pixelX = Math.round(obj.left + (obj.width * obj.scaleX) / 2);
            const pixelY = Math.round(obj.top + (obj.height * obj.scaleY) / 2);
            result.push({
                id: id,
                pixelPosition: { x: pixelX, y: pixelY },
                gridPosition: gridPos,
                gridPositionLabel: `${gridPos.colLabel}${gridPos.rowLabel}`
            });
        });
        return result;
    }
    
    // Remove object by ID
    removeObject(objectId) {
        const obj = this.objects.get(objectId);
        if (obj) {
            this.canvas.remove(obj);
            this.objects.delete(objectId);
            this.canvas.requestRenderAll();
            this.saveState();
            console.log(`Object ${objectId} removed`);
        }
    }
    
    // Clear all objects
    clearAll() {
        this.objects.forEach((obj, id) => {
            this.canvas.remove(obj);
        });
        this.objects.clear();
        this.canvas.requestRenderAll();
        this.saveState();
        console.log('All objects cleared');
    }
    
    // Save current canvas state
    saveState() {
        const state = {
            objects: [],
            timestamp: Date.now()
        };
        
        this.objects.forEach((obj, id) => {
            state.objects.push({
                id: id,
                left: obj.left,
                top: obj.top,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                angle: obj.angle,
                objectId: obj.objectId,
                src: obj._element.src
            });
        });
        
        this.history.push(state);
        
        // Keep only last maxHistory states
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        console.log(`State saved. History length: ${this.history.length}`);
    }
    
    // Restore canvas state
    restoreState(state) {
        // Clear current objects
        this.objects.forEach((obj, id) => {
            this.canvas.remove(obj);
        });
        this.objects.clear();
        
        // Restore objects from state
        state.objects.forEach(objData => {
            fabric.Image.fromURL(objData.src, (img) => {
                img.set({
                    left: objData.left,
                    top: objData.top,
                    scaleX: objData.scaleX,
                    scaleY: objData.scaleY,
                    angle: objData.angle,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    lockRotation: false,
                    lockScalingX: false,
                    lockScalingY: false,
                    lockMovementX: false,
                    lockMovementY: false,
                    transparentCorners: false,
                    cornerColor: 'rgba(102,153,255,0.8)',
                    cornerSize: 8,
                    cornerStyle: 'circle',
                    borderColor: 'rgba(102,153,255,0.8)',
                    borderScaleFactor: 1,
                    objectId: objData.objectId
                });
                
                this.canvas.add(img);
                this.objects.set(objData.id, img);
            });
        });
        
        this.canvas.requestRenderAll();
        console.log(`State restored with ${state.objects.length} objects`);
    }
    
    // Undo last action
    undo() {
        if (this.history.length > 1) {
            this.history.pop(); // Remove current state
            const previousState = this.history[this.history.length - 1];
            this.restoreState(previousState);
            console.log('Undo performed');
        } else {
            console.log('Nothing to undo');
        }
    }
    
    // Create control buttons
    createControlButtons() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'canvas-controls';
        buttonContainer.style.cssText = `
            position: absolute;
            bottom: -40px;
            left: 0px;
            z-index: 1000;
            display: flex;
            gap: 5px;
        `;
        
        // Create clear button
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '<i class="fa fa-trash"></i>';
        clearBtn.title = 'Clear all objects';
        clearBtn.className = 'btn btn-outline-danger btn-sm';
        clearBtn.style.cssText = `
            width: 35px;
            height: 35px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        clearBtn.onclick = () => this.clearAll();
        
        // Create undo button
        const undoBtn = document.createElement('button');
        undoBtn.innerHTML = '<i class="fa fa-undo"></i>';
        undoBtn.title = 'Undo last action';
        undoBtn.className = 'btn btn-outline-success btn-sm';
        undoBtn.style.cssText = `
            width: 35px;
            height: 35px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        undoBtn.onclick = () => this.undo();
        
        // Add buttons to container
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(undoBtn);
        
        // Add to canvas container
        container.appendChild(buttonContainer);
        
        console.log('Control buttons created');
    }
    
    // Delete selected object
    deleteSelected() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            // Find object ID
            let objectId = null;
            this.objects.forEach((obj, id) => {
                if (obj === activeObject) {
                    objectId = id;
                }
            });
            
            if (objectId) {
                this.removeObject(objectId);
                this.saveState();
                console.log(`Selected object ${objectId} deleted`);
            }
        } else {
            console.log('No object selected');
        }
    }
    
    // Check if object type is a color
    isColorObject(objectType) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 
                       'pink', 'brown', 'grey', 'black', 'white'];
        return colors.includes(objectType);
    }
    
    // Get objects list with positions in format: ["a2_tree", "a3_cat", ...] (excluding colors)
    getObjectsList() {
        const result = [];
        
        this.objects.forEach((obj, id) => {
            const gridCells = this.getObjectGridCells(obj);
            
            // Extract object type from objectId (e.g., "person_123456" -> "person")
            let objectType = obj.objectId;
            if (objectType && objectType.includes('_')) {
                objectType = objectType.split('_')[0];
            }
            
            // Skip color objects
            if (this.isColorObject(objectType)) {
                return;
            }
            
            // Add entry for each cell the object covers
            gridCells.forEach(cell => {
                const position = cell.colLabel + cell.rowLabel;
                const formattedItem = `${position}_${objectType}`;
                result.push(formattedItem);
            });
        });
        
        return result;
    }
    
    // Get colors list as string: "d2_red d3_red d4_red d5_red e2_red e3_red e4_red e5_red"
    getColorsString() {
        const colorEntries = [];
        
        this.objects.forEach((obj, id) => {
            const gridCells = this.getObjectGridCells(obj);
            
            // Extract object type from objectId
            let objectType = obj.objectId;
            if (objectType && objectType.includes('_')) {
                objectType = objectType.split('_')[0];
            }
            
            // Only include color objects
            if (!this.isColorObject(objectType)) {
                return;
            }
            
            // Add entry for each cell the color covers
            gridCells.forEach(cell => {
                const position = cell.colLabel + cell.rowLabel;
                const formattedItem = `${position}_${objectType}`;
                colorEntries.push(formattedItem);
            });
        });
        
        return colorEntries.join(' ');
    }
    
    // Get objects list with detailed information (excluding colors)
    getObjectsListDetailed() {
        const result = [];
        
        this.objects.forEach((obj, id) => {
            const gridCells = this.getObjectGridCells(obj);
            const pixelX = Math.round(obj.left + (obj.width * obj.scaleX) / 2);
            const pixelY = Math.round(obj.top + (obj.height * obj.scaleY) / 2);
            const dimensions = this.getObjectDimensions(obj);
            const gridDimensions = this.getObjectGridDimensions(obj);
            
            // Extract object type from objectId
            let objectType = obj.objectId;
            if (objectType && objectType.includes('_')) {
                objectType = objectType.split('_')[0];
            }
            
            // Skip color objects
            if (this.isColorObject(objectType)) {
                return;
            }
            
            result.push({
                id: id,
                objectType: objectType,
                centerPosition: gridCells.length > 0 ? gridCells[0].colLabel + gridCells[0].rowLabel : 'unknown',
                allPositions: gridCells.map(cell => cell.colLabel + cell.rowLabel),
                pixelPosition: { x: pixelX, y: pixelY },
                pixelDimensions: dimensions,
                gridDimensions: gridDimensions,
                gridCells: gridCells,
                formatted: gridCells.map(cell => `${cell.colLabel}${cell.rowLabel}_${objectType}`)
            });
        });
        
        return result;
    }
    
    // Get objects grouped by type (excluding colors)
    getObjectsByType() {
        const grouped = {};
        
        this.objects.forEach((obj, id) => {
            const gridCells = this.getObjectGridCells(obj);
            
            // Extract object type
            let objectType = obj.objectId;
            if (objectType && objectType.includes('_')) {
                objectType = objectType.split('_')[0];
            }
            
            // Skip color objects
            if (this.isColorObject(objectType)) {
                return;
            }
            
            if (!grouped[objectType]) {
                grouped[objectType] = [];
            }
            
            // Add all positions the object covers
            gridCells.forEach(cell => {
                const position = cell.colLabel + cell.rowLabel;
                if (!grouped[objectType].includes(position)) {
                    grouped[objectType].push(position);
                }
            });
        });
        
        return grouped;
    }
    
    // Get objects list in compact format (e.g., ["a2,a3,b2,b3_tree", "a3,b3_cat"])
    getObjectsListCompact() {
        const grouped = this.getObjectsByType();
        const result = [];
        
        for (const [objectType, positions] of Object.entries(grouped)) {
            const positionsStr = positions.join(',');
            result.push(`${positionsStr}_${objectType}`);
        }
        
        return result;
    }
}

// Global canvas managers
let canvasManager0 = null;
let canvasManager1 = null;

// Initialize canvas managers
function initCanvasManagers() {
    canvasManager0 = new CanvasManager('canvas0', 'canvasBlock0');
    canvasManager1 = new CanvasManager('canvas1', 'canvasBlock1');
    
    console.log('Canvas managers initialized');
}

// Global functions to get objects list
function getCanvas0Objects() {
    return canvasManager0 ? canvasManager0.getObjectsList() : [];
}

function getCanvas1Objects() {
    return canvasManager1 ? canvasManager1.getObjectsList() : [];
}

function getCanvas0ObjectsDetailed() {
    return canvasManager0 ? canvasManager0.getObjectsListDetailed() : [];
}

function getCanvas1ObjectsDetailed() {
    return canvasManager1 ? canvasManager1.getObjectsListDetailed() : [];
}

function getCanvas0ObjectsCompact() {
    return canvasManager0 ? canvasManager0.getObjectsListCompact() : [];
}

function getCanvas1ObjectsCompact() {
    return canvasManager1 ? canvasManager1.getObjectsListCompact() : [];
}

function getCanvas0ObjectsByType() {
    return canvasManager0 ? canvasManager0.getObjectsByType() : {};
}

function getCanvas1ObjectsByType() {
    return canvasManager1 ? canvasManager1.getObjectsByType() : {};
}

// Functions to get object dimensions and grid cells
function getCanvas0ObjectDimensions(objectId) {
    if (!canvasManager0) return null;
    const obj = canvasManager0.objects.get(objectId);
    return obj ? canvasManager0.getObjectDimensions(obj) : null;
}

function getCanvas1ObjectDimensions(objectId) {
    if (!canvasManager1) return null;
    const obj = canvasManager1.objects.get(objectId);
    return obj ? canvasManager1.getObjectDimensions(obj) : null;
}

function getCanvas0ObjectGridCells(objectId) {
    if (!canvasManager0) return null;
    const obj = canvasManager0.objects.get(objectId);
    return obj ? canvasManager0.getObjectGridCells(obj) : null;
}

function getCanvas1ObjectGridCells(objectId) {
    if (!canvasManager1) return null;
    const obj = canvasManager1.objects.get(objectId);
    return obj ? canvasManager1.getObjectGridCells(obj) : null;
}

function getCanvas0ObjectGridDimensions(objectId) {
    if (!canvasManager0) return null;
    const obj = canvasManager0.objects.get(objectId);
    return obj ? canvasManager0.getObjectGridDimensions(obj) : null;
}

function getCanvas1ObjectGridDimensions(objectId) {
    if (!canvasManager1) return null;
    const obj = canvasManager1.objects.get(objectId);
    return obj ? canvasManager1.getObjectGridDimensions(obj) : null;
}

// Function to get all objects with their grid coverage
function getCanvas0ObjectsWithCoverage() {
    if (!canvasManager0) return [];
    const result = [];
    canvasManager0.objects.forEach((obj, id) => {
        const gridCells = canvasManager0.getObjectGridCells(obj);
        const dimensions = canvasManager0.getObjectDimensions(obj);
        const gridDimensions = canvasManager0.getObjectGridDimensions(obj);
        
        let objectType = obj.objectId;
        if (objectType && objectType.includes('_')) {
            objectType = objectType.split('_')[0];
        }
        
        result.push({
            id: id,
            objectType: objectType,
            gridCells: gridCells.map(cell => cell.colLabel + cell.rowLabel),
            pixelDimensions: dimensions,
            gridDimensions: gridDimensions
        });
    });
    return result;
}

function getCanvas1ObjectsWithCoverage() {
    if (!canvasManager1) return [];
    const result = [];
    canvasManager1.objects.forEach((obj, id) => {
        const gridCells = canvasManager1.getObjectGridCells(obj);
        const dimensions = canvasManager1.getObjectDimensions(obj);
        const gridDimensions = canvasManager1.getObjectGridDimensions(obj);
        
        let objectType = obj.objectId;
        if (objectType && objectType.includes('_')) {
            objectType = objectType.split('_')[0];
        }
        
        result.push({
            id: id,
            objectType: objectType,
            gridCells: gridCells.map(cell => cell.colLabel + cell.rowLabel),
            pixelDimensions: dimensions,
            gridDimensions: gridDimensions
        });
    });
    return result;
}

// Functions to get colors as string
function getCanvas0ColorsString() {
    return canvasManager0 ? canvasManager0.getColorsString() : '';
}

function getCanvas1ColorsString() {
    return canvasManager1 ? canvasManager1.getColorsString() : '';
}

// Functions to get colors as array
function getCanvas0ColorsArray() {
    const colorsString = getCanvas0ColorsString();
    return colorsString ? colorsString.split(' ') : [];
}

function getCanvas1ColorsArray() {
    const colorsString = getCanvas1ColorsString();
    return colorsString ? colorsString.split(' ') : [];
}

// Functions to get colors grouped by type
function getCanvas0ColorsByType() {
    if (!canvasManager0) return {};
    const grouped = {};
    
    canvasManager0.objects.forEach((obj, id) => {
        const gridCells = canvasManager0.getObjectGridCells(obj);
        
        let objectType = obj.objectId;
        if (objectType && objectType.includes('_')) {
            objectType = objectType.split('_')[0];
        }
        
        // Only include color objects
        if (!canvasManager0.isColorObject(objectType)) {
            return;
        }
        
        if (!grouped[objectType]) {
            grouped[objectType] = [];
        }
        
        // Add all positions the color covers
        gridCells.forEach(cell => {
            const position = cell.colLabel + cell.rowLabel;
            if (!grouped[objectType].includes(position)) {
                grouped[objectType].push(position);
            }
        });
    });
    
    return grouped;
}

function getCanvas1ColorsByType() {
    if (!canvasManager1) return {};
    const grouped = {};
    
    canvasManager1.objects.forEach((obj, id) => {
        const gridCells = canvasManager1.getObjectGridCells(obj);
        
        let objectType = obj.objectId;
        if (objectType && objectType.includes('_')) {
            objectType = objectType.split('_')[0];
        }
        
        // Only include color objects
        if (!canvasManager1.isColorObject(objectType)) {
            return;
        }
        
        if (!grouped[objectType]) {
            grouped[objectType] = [];
        }
        
        // Add all positions the color covers
        gridCells.forEach(cell => {
            const position = cell.colLabel + cell.rowLabel;
            if (!grouped[objectType].includes(position)) {
                grouped[objectType].push(position);
            }
        });
    });
    
    return grouped;
}

// Drop function for drag & drop
function handleDrop(event) {
    event.preventDefault();
    
    const id = event.dataTransfer.getData("text");
    if (!id) return;
    
    const src = document.getElementById(id);
    if (!src) return;
    
    // Find canvas container
    const zone = findDropZone(event.target);
    if (!zone) return;
    
    // Determine which canvas to use
    let canvasManager = null;
    if (zone.querySelector('#canvas0')) {
        canvasManager = canvasManager0;
    } else if (zone.querySelector('#canvas1')) {
        canvasManager = canvasManager1;
    }
    
    if (!canvasManager) {
        console.error('No canvas manager found');
        return;
    }
    
    // Calculate drop position
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Generate unique ID
    const objectId = id + '_' + Date.now();
    
    // Add object at position
    canvasManager.addObjectAtPosition(src.src, x, y, objectId);
}

// Helper function to find drop zone
function findDropZone(element) {
    while (element && element !== document && !element.classList.contains('canvas-container')) {
        element = element.parentElement;
    }
    return element;
}

// Allow drop function
function allowDrop(event) {
    event.preventDefault();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initCanvasManagers();
    
    // Add object info display
    const infoDiv = document.createElement('div');
    infoDiv.id = 'object-info';
    infoDiv.style.cssText = 'position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border: 1px solid #ccc; z-index: 1000;';
    infoDiv.textContent = 'No object selected';
    // document.body.appendChild(infoDiv);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Delete selected object (Delete or Backspace)
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (canvasManager0 && canvasManager0.canvas.getActiveObject()) {
                canvasManager0.deleteSelected();
                e.preventDefault();
            } else if (canvasManager1 && canvasManager1.canvas.getActiveObject()) {
                canvasManager1.deleteSelected();
                e.preventDefault();
            }
        }
        
        // Undo (Ctrl+Z)
        if (e.ctrlKey && e.key === 'z') {
            if (canvasManager0) {
                canvasManager0.undo();
                e.preventDefault();
            } else if (canvasManager1) {
                canvasManager1.undo();
                e.preventDefault();
            }
        }
    });
    
    console.log('Canvas system initialized with keyboard shortcuts');
}); 