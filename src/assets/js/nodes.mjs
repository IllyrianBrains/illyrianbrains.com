class NetworkGraph extends HTMLElement {
    constructor() {
        super();

        this.canvas = document.createElement('canvas');
        this.styleWrapper = document.createElement('style');
        const bg = this.getAttribute('background') || '';

        this.styleWrapper.textContent = `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0; left: 0;
        z-index: 0;
        background: url('${bg}') no-repeat center center / cover;
        background-color:rgb(253, 255, 255);
      }

      canvas {
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
    `;

        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.append(this.styleWrapper, this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = new Map();
        this.groups = [];
        this.mouse = { x: -1000, y: -1000 };

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        Object.assign(this.tooltip.style, {
            display: 'none',
            position: 'absolute',
            color: '#000',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            fontFamily: 'sans-serif',
            zIndex: '10',
        });
        document.body.appendChild(this.tooltip);
    }

    connectedCallback() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.initNodes(80);
        this.seedGroups(20);
        requestAnimationFrame(() => this.draw());
    }

    resize() {
        this.canvas.width = this.offsetWidth;
        this.canvas.height = this.offsetHeight;
    }

    initNodes(count) {
        const transparency = 0.1; // Adjust as needed
        const hexColors = [ '#D41414', '#000', '#E5E5E7'];

        // Convert hex color to rgba with transparency
        const hexToRgba = (hex, alpha) => {
            const bigint = parseInt(hex.replace('#', ''), 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        for (let i = 0; i < count; i++) {
            const hex = hexColors[Math.floor(Math.random() * hexColors.length)];
            const color = hexToRgba(hex, transparency);

            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: Math.random() * 5 + 3,
                color: color,
                id: i
            });
        }
    }

    seedGroups(count) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;

        for (let i = 0; i < count; i++) {
            const centerX = (i + 0.5) * (canvasWidth / count); // even horizontal spacing
            const centerY = Math.random() * canvasHeight;

            const group = [];

            // pick nearest 3 nodes to that region
            const candidates = this.nodes
                .map((node, index) => ({
                    index,
                    dist: Math.hypot(node.x - centerX, node.y - centerY)
                }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 3)
                .map(({ index }) => index);

            this.groups.push({ members: candidates });
        }
    }


    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const maxDist = 150;

        // Draw edges (connections)
        for (let i = 0; i < this.nodes.length; i++) {
            const n1 = this.nodes[i];
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n2 = this.nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const key = `${i}-${j}`;

                if (dist < maxDist) {
                    if (!this.connections.has(key)) this.connections.set(key, { opacity: 0.1 });
                    else this.connections.get(key).opacity = Math.min(0.25, this.connections.get(key).opacity + 0.01);

                    ctx.strokeStyle = `rgba(50, 50, 50, 0.05)`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                } else if (this.connections.has(key)) {
                    this.connections.get(key).opacity -= 0.01;
                    if (this.connections.get(key).opacity <= 0) this.connections.delete(key);
                }
            }
        }
        /*
        // Compute group centers and radii
        const groupData = this.groups.map(group => {
            const cluster = group.members.map(i => this.nodes[i]);
            if (cluster.length < 3) return null;

            const avgX = cluster.reduce((sum, n) => sum + n.x, 0) / cluster.length;
            const avgY = cluster.reduce((sum, n) => sum + n.y, 0) / cluster.length;
            const radius = 80 + cluster.length * 1.5;

            return { cluster, x: avgX, y: avgY, r: radius };
        }).filter(Boolean);

        // Prevent overlapping group halos
        for (let i = 0; i < groupData.length; i++) {
            const g1 = groupData[i];
            let overlap = false;

            for (let j = 0; j < i; j++) {
                const g2 = groupData[j];
                const dx = g1.x - g2.x;
                const dy = g1.y - g2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < g1.r + g2.r - 20) { // small buffer to prevent touching
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                ctx.fillStyle = "rgba(0, 163, 108, 0.025)";
                ctx.beginPath();
                ctx.arc(g1.x, g1.y, g1.r, 0, Math.PI * 2);
                ctx.fill();
            }
        }

       */ 

        // Draw nodes
        let hoveredNode = null;
        for (const node of this.nodes) {
            const dist = Math.hypot(node.x - this.mouse.x, node.y - this.mouse.y);
            const isHovered = dist < 8;
            if (isHovered) hoveredNode = node;

            ctx.fillStyle = isHovered
                ? "rgba(212, 20, 20, 0.6)"
                : node.color;
            ctx.shadowColor = isHovered ? "rgba(212, 20, 20, 0.6)" : "rgba(212, 20, 20, 0.2)";
            ctx.shadowBlur = isHovered ? 8 : 4;

            ctx.beginPath();

            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);

            ctx.fill();
            ctx.shadowBlur = 0;

            // Update motion
            node.x += node.vx;
            node.y += node.vy;


            // Bounce on edges
            if (node.x < 0 || node.x > this.canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > this.canvas.height) node.vy *= -1;

        }

        // Tooltip
        if (hoveredNode) {
            this.tooltip.style.left = `${hoveredNode.x + this.canvas.getBoundingClientRect().left + 10}px`;
            this.tooltip.style.top = `${hoveredNode.y + this.canvas.getBoundingClientRect().top}px`;
            this.tooltip.innerText = `Node #${hoveredNode.id}`;
            this.tooltip.style.display = 'block';
        } else {
            this.tooltip.style.display = 'none';
        }

        requestAnimationFrame(() => this.draw());
    }
}

customElements.define('network-graph', NetworkGraph);
