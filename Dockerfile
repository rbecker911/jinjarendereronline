# Build step #1: build the React front end
FROM node:16-alpine as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/ ./
RUN yarn install
RUN yarn run build-prod

# Build step #2: build server
FROM python:3.9-alpine

WORKDIR /root
COPY ./server ./
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY --from=build-step /app/dist ./static/dist

# Change bind host
#RUN sed -i 's/host=config.HOST/host="0.0.0.0"/g' ./app.py

# Expose port to Host
EXPOSE 8000

# Define default command.
CMD ["gunicorn", "-b", ":8000", "--access-logfile", "-", "--error-logfile", "-", "wsgi:app"]