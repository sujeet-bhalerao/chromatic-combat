from flask import Flask, render_template, jsonify, request, session

app = Flask(__name__)
app.secret_key = 'chromatic_combat'

@app.route('/')
def index():
    reset_game_state()
    return render_template('index.html')

def is_proper_coloring(graph):
    
    for link in get_links():
        source_color = graph[str(link['source'])]
        target_color = graph[str(link['target'])]
        if source_color is not None and source_color == target_color:
            return False
    return True

@app.route('/move', methods=['POST'])
def move():
    data = request.json
    node_id = str(data['node'])
    color = data['color']
    graph = session['graph']
    game = session['game']

    if game['is_over'] or graph.get(node_id) is not None or not is_valid_move(node_id, color, graph):
        return jsonify({'success': False, 'message': 'Invalid move or game over.'})

    graph[node_id] = color

    if is_game_over(graph):
        game['is_over'] = True
        game['winner'] = 'Maker' if is_proper_coloring(graph) else 'Breaker'

    game['turn'] = 'Breaker' if game['turn'] == 'Maker' else 'Maker'
    session['graph'] = graph
    session['game'] = game
    return jsonify({'success': True, 'turn': game['turn'], 'is_over': game['is_over'], 'winner': game['winner']})

@app.route('/reset', methods=['POST'])
def reset():
    reset_game_state()
    return jsonify({'success': True, 'turn': 'Maker'})

def reset_game_state():
    session['game'] = {'turn': 'Maker', 'is_over': False, 'winner': None}
    session['graph'] = {1: None, 2: None, 3: None, 4: None, 5: None}

def is_valid_move(node_id, color, graph):
    for link in get_links():
        if link['source'] == node_id and graph[link['target']] == color:
            return False
        if link['target'] == node_id and graph[link['source']] == color:
            return False
    return True

def is_game_over(graph):
    return all(color is not None for color in graph.values())

def get_links():
    return [{'source': 1, 'target': 2}, {'source': 1, 'target': 3}, {'source': 2, 'target': 4},
            {'source': 3, 'target': 5}, {'source': 4, 'target': 5}]

if __name__ == '__main__':
    app.run(debug=True)