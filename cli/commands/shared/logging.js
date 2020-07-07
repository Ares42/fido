const emojis = {
  success: '✅',
  warning: '⚠️ ',
  failure: '❌',
};

function logSuccess(message) {
  console.log(`${emojis.success} ${message}`);
}

function logWarning(message) {
  console.warn(`${emojis.warning} ${message}`);
}

function logFailure(error) {
  if (error instanceof Error) {
    console.log(error);
    console.error(`${emojis.failure} ${error.message}`);
  } else {
    console.error(`${emojis.failure} ${error}`);
  }
}

module.exports = {
  logSuccess,
  logWarning,
  logFailure,
};
