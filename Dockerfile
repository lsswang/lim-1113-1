FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm install --legacy-peer-deps

COPY . .

RUN cd frontend && npm run build

RUN cd backend && node src/seed.js

EXPOSE 3001

CMD ["npm", "start"]
