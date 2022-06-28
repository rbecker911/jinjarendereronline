# Template Engine Online

![Alt text](Screenshot.png?raw=true)

## Features

- Switch between Render entity and Entity insight
- Autocompletion - `input_json` and every key from the json object, `if`, `if-else`, `for`, `set` and `do`.
- Right click on any key in the json and click `Use` to paste it's path in the Template editor (automatically
  includes `input_json`)
  Features Switch between Render Template and Entity Insight from the navigation bar. Entity insight mode expects a list
  of objects.
- To format the json object, right click the editor and select Format Document.
- Press F1 on each editor to view actions and keyboard shortcuts.

## How to run

```bash
git clone https://github.com/rbecker911/jinjarendereronline/jinjarendereronline.git
cd ./jinjarendereronline
docker build --rm -t jinja-renderer .
docker run -d --name jinja -p 8089:8000/tcp jinja-renderer
```

Then

```
http://localhost:8089
```

## Modules

- Python 3.9
- Flask
- Jinja
- Gunicorn
- React + Redux
- Bootstrap
- monaco-editor
- axios
- webpack

## API

```
POST /render
```

| Parameter Name | Type | Description | Mandatory |
| -------------- | ---- | ----------- | --------- |
| template | String | The template to render | True |
| inputJson | String | Input Json | True |
| mode | String | Rendering mode. Can be `render` or `entity`| False |

### Response

#### Render Mode

| Parameter Name | Type | Description |
| -------------- | ---- | ----------- |
| status | String | `success` |
| render | String | The final render |

#### Entity Mode

| Parameter Name | Type | Description |
| -------------- | ---- | ----------- |
| status | String | `success` |
| renders | List | list of renders - {`entity` - Entity Identifier, `render` - Entity Render}|

### Errors

| Parameter Name | Type | Description |
| -------------- | ---- | ----------- |
| status | String | `error` |
| message | String | Failure reason |
