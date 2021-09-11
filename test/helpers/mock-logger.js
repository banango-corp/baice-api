'use strict'

const sinon = require('sinon')

const mockLogger = () => {
  const logger = {
    trace: sinon.spy(),
    debug: sinon.spy(),
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy(),
    fatal: sinon.spy()
  }
  logger.child = () => logger
  return logger
}

module.exports = {
  mockLogger
}
