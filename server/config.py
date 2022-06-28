import os

DEBUG = os.environ.get('DEBUG', False)
HOST = os.environ.get('HOST', 'localhost')
PORT = int(os.environ.get('PORT', 443))
