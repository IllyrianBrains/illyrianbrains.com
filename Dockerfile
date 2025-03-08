# === Build Stage ===
FROM node:20-alpine as builder

# Install Eleventy globally
RUN npm install -g @11ty/eleventy

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files for Eleventy build
COPY src ./src
COPY redirects.js .      
COPY .eleventy.js .

# Build the static site from src to _site
RUN eleventy --input=src --output=_site

# === Final Stage ===
FROM node:20-alpine

# Install a lightweight static file server
RUN npm install -g http-server

WORKDIR /site

# Copy generated static site
COPY --from=builder /app/_site .

EXPOSE 8082

CMD ["http-server", "-p", "8082"]
