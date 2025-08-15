// New Canvas System with Grid Coordinates
class CanvasManager {
    constructor(canvasId, containerId) {
        this.canvasId = canvasId;
        this.containerId = containerId;
        this.canvas = null;
        this.gridSize = { width: 7, height: 7 }; // 7x7 grid (a-g, 1-7)
        this.cellSize = { width: 39, height: 22 }; // 275/7, 154/7
        this.objects = new Map(); // Store objects with grid coordinates
        
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
    
    // Get grid position of an object
    getGridPosition(obj) {
        const centerX = obj.left + (obj.width * obj.scaleX) / 2;
        const centerY = obj.top + (obj.height * obj.scaleY) / 2;
        return this.pixelToGrid(centerX, centerY);
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
            
            console.log(`Object ${objectId} added at grid position ${String.fromCharCode(97 + col)}${row + 1}`);
        });
    }
    
    // Add object at mouse position (for drag & drop)
    addObjectAtPosition(imageSrc, mouseX, mouseY, objectId) {
        const gridPos = this.pixelToGrid(mouseX, mouseY);
        this.addObjectAtGrid(imageSrc, gridPos.col, gridPos.row, objectId);
    }
    
    // Update object position when moved
    updateObjectPosition(obj) {
        const gridPos = this.getGridPosition(obj);
        obj.gridPosition = gridPos;
        
        // Snap to grid center
        const pixelPos = this.gridToPixel(gridPos.col, gridPos.row);
        obj.set({
            left: pixelPos.x - (obj.width * obj.scaleX) / 2,
            top: pixelPos.y - (obj.height * obj.scaleY) / 2
        });
        
        this.canvas.requestRenderAll();
        this.updateObjectInfo(obj);
    }
    
    // Update object info display
    updateObjectInfo(obj) {
        const gridPos = this.getGridPosition(obj);
        const info = `Object: ${obj.objectId} | Position: ${gridPos.colLabel}${gridPos.rowLabel}`;
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
    
    // Get all objects with their grid positions
    getAllObjects() {
        const result = [];
        this.objects.forEach((obj, id) => {
            const gridPos = this.getGridPosition(obj);
            result.push({
                id: id,
                gridPosition: gridPos,
                position: `${gridPos.colLabel}${gridPos.rowLabel}`
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
        console.log('All objects cleared');
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
    document.body.appendChild(infoDiv);
}); 