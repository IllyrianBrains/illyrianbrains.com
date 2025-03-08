# Dev image for live preview
FROM python:3.13-alpine

# Install dependencies
RUN apk add --no-cache git bash
RUN pip install mkdocs mkdocs-material

# Set working directory
WORKDIR /site

# Copy all files
COPY docs docs
COPY theme theme
COPY includes includes
COPY index-generation.sh .
COPY *.yml .

RUN ./index-generation.sh

EXPOSE 8082

# Run MkDocs live server
CMD ["mkdocs", "serve", "-a", "0.0.0.0:8082"]
