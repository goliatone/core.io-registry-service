FROM        node:6.5
MAINTAINER  hello@goliatone.com

RUN \
    mkdir -p /usr/src/app

WORKDIR /usr/src/app

# Add dumb-init to solve docker's dangling pid 0
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 && \
    chmod +x /usr/local/bin/dumb-init && \
    #install dependencies for canvas < face-crop < routes/image
    apt-get update
    #&& apt-get install -y build-essential g++

#use changes to package.json to force Docker to not use
#cache. Use docker build --no-cache to force npm install.
ADD ./src/package.json /tmp/package.json

RUN cd /tmp && npm install --production
RUN cp -a /tmp/node_modules /usr/src/app/

COPY ./src/ /usr/src/app

EXPOSE 3000 8989

CMD ["dumb-init", "node", "index.js"]
