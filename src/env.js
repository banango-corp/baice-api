const Joi = require('joi')
const VError = require('verror')

const envSchema = Joi.object({
  ACCOUNT_NAME: Joi.string().required(),
  ACCOUNT_KEY: Joi.string().required(),
  CONTAINER_NAME: Joi.string().required(),
  HTTP_SERVER_PORT: Joi.number().required(),
  MONGODB_CONN_STRING: Joi.string().required()
})

function parseEnv(processEnv) {
  const result = envSchema.validate(processEnv, {
    allowUnknown: true
  })
  if (result.error) {
    throw new VError(result.error, 'Environment variables are not properly set')
  }
  return result.value
}

module.exports = {
  parseEnv
}
