# Use Node.js for building the frontend
FROM node:18 as build

WORKDIR /app

COPY package*.json ./
RUN npm install


# Use Nginx to serve the built frontend

COPY . .
EXPOSE 80

CMD ["npm","run", "dev"]
