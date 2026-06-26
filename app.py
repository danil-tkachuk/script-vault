from flask import Flask, jsonify, request, render_template
import database

app = Flask(__name__)

# Initialize the SQLite database
database.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scripts', methods=['GET'])
def get_scripts():
    try:
        scripts = database.get_all_scripts()
        return jsonify(scripts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scripts', methods=['POST'])
def add_script():
    try:
        data = request.get_json()
        if not data or 'name' not in data or not data['name'].strip():
            return jsonify({'error': 'Name is required'}), 400
        if 'content' not in data or not data['content'].strip():
            return jsonify({'error': 'Script content is required'}), 400
        
        name = data['name'].strip()
        content = data['content']
        
        script_id = database.add_script(name, content)
        
        return jsonify({
            'id': script_id,
            'name': name,
            'content': content
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scripts/<int:script_id>', methods=['PUT'])
def update_script(script_id):
    try:
        data = request.get_json()
        if not data or 'name' not in data or not data['name'].strip():
            return jsonify({'error': 'Name is required'}), 400
        if 'content' not in data or not data['content'].strip():
            return jsonify({'error': 'Script content is required'}), 400
        
        name = data['name'].strip()
        content = data['content']
        
        database.update_script(script_id, name, content)
        return jsonify({'message': 'Script updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scripts/<int:script_id>', methods=['DELETE'])
def delete_script(script_id):
    try:
        database.delete_script(script_id)
        return jsonify({'message': 'Script deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
