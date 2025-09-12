FROM node:lts AS buildStage

# Get ssh keys from build args
ARG SSH_PRIVATE_KEY
RUN mkdir -p /root/.ssh && chmod 0700 /root/.ssh
RUN mkdir -p -m 600 /root/.ssh && ssh-keyscan github.com >> /root/.ssh/known_hosts
RUN echo "$SSH_PRIVATE_KEY" > /root/.ssh/id_rsa && chmod 600 /root/.ssh/id_rsa && chmod 600 /root/.ssh/id_rsa.pub

# create working dir for the app and cd into it
RUN mkdir -p /app
WORKDIR /app

# add the package.json and install non dev deps
COPY package.json .
RUN npm install --omit=dev

# allow smaller image
FROM node:lts-slim AS deployStage

# copy the files from app buildStage and cd into it
COPY --from=buildStage /app /app
WORKDIR /app

# copy the app files
COPY . .

# set env
ENV PS1="$(whoami)@$(hostname):$(pwd)\\$ "

# start the app
CMD [ "node", "indexGenerated.js"]
