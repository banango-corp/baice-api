#!/bin/bash

source /home/vagrant/.profile
cd /var/lib/jenkins/workspace/baice-api
env $(cat .env)
npm start
