'use strict'

require('dotenv').config()

const db = require('mongoose')

const api = require('./api')
const { parseEnv } = require('./env')
const { newLogger } = require('./logger')

const env = parseEnv(process.env)
const logger = newLogger()

logger.info('Starting application')
api.start({ env, logger, db })
  .then(() => logger.info('Application started'))
  .catch(logger.error)
