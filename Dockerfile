# Use official Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy only package.json and package-lock.json first
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy rest of the backend files
COPY . .

# Expose the port (matches your backend, e.g., 5000)
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
