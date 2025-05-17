FROM node:20-alpine

# Install Eleventy and HTML minifier globally
RUN npm install -g @11ty/eleventy

WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm ci

# Expose preview port
EXPOSE 8080

# Default command: serve site
CMD ["eleventy", "--serve", "--port=8080"]
