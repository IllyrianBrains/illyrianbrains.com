# Dev image for live preview
FROM python:3.13-alpine

# Install dependencies
RUN apk add --no-cache git bash curl jq 
COPY Pipfile .
COPY Pipfile.lock .

RUN python -m ensurepip && \
    pip install --no-cache --upgrade pip && \
    pip install --no-cache pipenv
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install
RUN pip install --no-cache mkdocs-material

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
