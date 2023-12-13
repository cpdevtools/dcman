# Dev Container Manager

A command line utility to help manage dev containers

## Prerequisites

### Windows

- WSL
- WSL Ubuntu 20+
- Docker Desktop

### linux

#### Docker

```bash
curl -s https://raw.githubusercontent.com/karaage0703/ubuntu-setup/master/install-docker.sh | bash
```

### linux / WSL linux
#### NVM / NodeJs

```bash
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.bashrc
nvm install 18
```



## Install

```bash
npm i -g @cpdevtools/dcman-cli && dcm install
```

## setup

### Create profile source

```bash
 dcm profile-sources create <OWNER/REPO>
```

### Add an existing profile source

```bash
 dcm profile-sources add <OWNER/REPO>
```

### create a profile

```bash
 dcm profiles create <OWNER/REPO> [<profile>]
```

## Help

```
bash dcm --help
```
