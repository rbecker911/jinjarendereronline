import json
from inspect import getmembers, isfunction

from flask import Flask, render_template, request, jsonify
from jinja2 import Environment, exceptions

import config

app = Flask(__name__)
MODE_RENDER = "render"
MODE_ENTITY = "entity"


def get_custom_filters():
    import filters
    custom_filters = {}
    for m in getmembers(filters):
        if m[0].startswith('filter_') and isfunction(m[1]):
            filter_name = m[0][7:]
            custom_filters[filter_name] = m[1]
    return custom_filters


@app.route("/")
def index():
    return render_template("index.html")


@app.route('/filters', methods=["GET"])
def getFilters():
    from filters import DOCS
    return jsonify(DOCS)


@app.route('/examples', methods=["GET"])
def getExamples():
    from examples import EXAMPLES
    return jsonify(EXAMPLES)


@app.route('/render', methods=['POST'])
def render():
    jinja2_env = Environment(autoescape=True,
                             extensions=['jinja2.ext.do', 'jinja2.ext.loopcontrols'],
                             trim_blocks=True,
                             lstrip_blocks=True)
    jinja2_env.filters.update(get_custom_filters())

    try:
        req = request.get_json()
        template = req['template']
        inputJson = req['inputJson']
        mode = req.get("mode", MODE_RENDER)
        caseContext = req.get("context", {})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    try:
        template = jinja2_env.from_string(template)
    except exceptions.TemplateSyntaxError as e:
        return jsonify({"status": "error", "message": f"Syntax error in jinja2 template: {e}", "lineno": e.lineno}), 400
    except exceptions.TemplateError as e:
        return jsonify({"status": "error", "message": f"Syntax error in jinja2 template: {e}"}), 400

    try:
        input_json = json.loads(inputJson)
    except json.JSONDecodeError as e:
        return jsonify(
            {"status": "error", "message": f"Value error in JSON: {e}", "lineno": e.lineno, "colno": e.colno}), 400
    except ValueError as e:
        return jsonify({"status": "error", "message": f"Value error in JSON: {e}"}), 400

    try:
        if mode == MODE_RENDER:
            rendered = template.render(input_json=input_json)
            return jsonify({"status": "success", "render": rendered}), 200
        elif mode == MODE_ENTITY:
            if not isinstance(input_json, (list)):
                return jsonify({"status": "error", "message": f"Input json must be a list in entity mode"}), 400
            renders = []
            for entity in input_json:
                if caseContext:
                    pass
                renders.append({"entity": entity["Entity"], "render": template.render(entity["EntityResult"])})
            return jsonify({"status": "success", "renders": renders})
        else:
            raise ValueError(f"Unknown mode {mode}")
    except (exceptions.TemplateRuntimeError, ValueError, TypeError, KeyError) as e:
        if isinstance(e, KeyError):
            return jsonify({"status": "error", "message": f"{e} is missing in one of the entities object"}), 400
        return jsonify({"status": "error", "message": f"Error rendering the template: {e}"}), 400


if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
