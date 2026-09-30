# Use official Node.js LTS image
FROM node:22-slim

# Install native dependencies required for better-sqlite3 build
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package definitions
COPY package*.json ./
COPY client/package*.json ./client/

# Install root & client dependencies
RUN npm install
RUN npm --prefix client install

# Copy project source files
COPY . .

# Build Vite frontend into client/dist
RUN npm run build

# Expose default port
EXPOSE 5959

# Start application server
CMD ["node", "server/index.js"]
