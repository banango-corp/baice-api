const pino = require('pino')
const { serializeError } = require('serialize-error')

const levelFormatter = (label) => {
  return { level: label }
}

function newLogger() {
  const logger = pino({
    formatters: {
      level: levelFormatter
    }
  })
  return {
    trace: logger.trace.bind(logger),
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: (error) => logger.error(serializeError(error)),
    fatal: logger.fatal.bind(logger),
    child: logger.child.bind(logger)
  }
}

module.exports = {
  newLogger
}
