#!/bin/bash

docker stop ib.com
docker remove ib.com
docker build --no-cache --progress=plain -t ib.com .
docker run -d --name ib.com -p 8081:8082 --restart always ib.com
