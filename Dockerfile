# Base Node image
FROM node:alpine3.20

# Optional: install mysql client for manual testing (optional but useful)
RUN apk add --no-cache mysql-client

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy all files
COPY . .

# App runs on port 4000
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start"]
