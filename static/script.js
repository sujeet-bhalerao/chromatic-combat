let currentTurn = 'Maker';
let gameStarted = false;
let graphState = {1: null, 2: null, 3: null, 4: null, 5: null};


const graph = {
    nodes: [
        { id: 1, x: 100, y: 100 }, 
        { id: 2, x: 200, y: 50 },
        { id: 3, x: 200, y: 150 },
        { id: 4, x: 300, y: 50 },
        { id: 5, x: 300, y: 150 }
    ],
    links: [
        { source: 1, target: 2 },
        { source: 1, target: 3 },
        { source: 2, target: 4 },
        { source: 3, target: 5 },
        { source: 4, target: 5 }
    ]
};


const svg = d3.select('#graph').append('svg')
    .attr('viewBox', '0 0 400 200')
    .attr('width', '100%')
    .attr('height', '100%');

const links = svg.selectAll('.link')
    .data(graph.links)
    .enter().append('line')
    .attr('class', 'link')
    .attr('x1', d => graph.nodes[d.source - 1].x)
    .attr('y1', d => graph.nodes[d.source - 1].y)
    .attr('x2', d => graph.nodes[d.target - 1].x)
    .attr('y2', d => graph.nodes[d.target - 1].y);

const nodes = svg.selectAll('.node')
    .data(graph.nodes)
    .enter().append('circle')
    .attr('class', 'node')
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .attr('r', 20)
    .attr('fill', 'white')
    .attr('stroke', 'black');


const colors = d3.selectAll('.color');
colors.on('dragstart', function(event, d) {
    if (gameStarted) {
        event.dataTransfer.setData('color', event.target.style.backgroundColor);
    } else {
        event.preventDefault(); 
    }
});

nodes.on('dragover', function(event) {
    event.preventDefault();
});

function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return rgb; 

    const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!parts) return null; 

    const r = parseInt(parts[1], 10);
    const g = parseInt(parts[2], 10);
    const b = parseInt(parts[3], 10);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}


nodes.on('drop', function(event, d) {
    event.preventDefault();
    let color = event.dataTransfer.getData('color');
    color = rgbToHex(color); 
    const nodeId = d.id.toString(); 

    if (graphState[nodeId] === null && gameStarted) { 
        fetch('/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ node: nodeId, color: color }),
        }).then(response => response.json())
        .then(data => {
            if (data.success) {
                d3.select(this).style('fill', color); 
                graphState[nodeId] = color; 
                updateTurnDisplay(data.turn);
                if (data.is_over) {
                    const winnerInfo = document.getElementById('winner-info');
                    winnerInfo.textContent = 'Winner: ' + data.winner;
                    winnerInfo.style.display = 'block'; 
                    winnerInfo.classList.add('show'); 
                    document.getElementById('play-again-btn').style.display = 'block';
                    document.getElementById('start-btn').style.display = 'none';
                }
            } else {
                alert(data.message);
            }
        }).catch(error => {
            console.error('Fetch error:', error);
        });
    } else {
        alert('This node is already colored or the game has not started!');
    }
});



document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('play-again-btn').addEventListener('click', startGame);

function startGame() {
    fetch('/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            gameStarted = true;
            resetGame();
            document.getElementById('turn-info').style.display = 'block'; 
            updateTurnDisplay(currentTurn);
        }
    });
}

function resetGame() {
    nodes.style('fill', 'white');
    graphState = {1: null, 2: null, 3: null, 4: null, 5: null};
    currentTurn = 'Maker';
    updateTurnDisplay(currentTurn);
    document.getElementById('winner-info').style.display = 'none';
    document.getElementById('play-again-btn').style.display = 'none';
    document.getElementById('start-btn').style.display = 'block';
    document.getElementById('turn-info').style.display = 'none';
}

function updateTurnDisplay(turn) {
    document.getElementById('turn-info').textContent = 'Turn: ' + turn;
}