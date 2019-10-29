const core = require('@actions/core')

process.on('unhandledRejection', handleError);
function handleError(err) {
  console.error(err)
  core.setFailed(err.message)
}

exports.handle = handleError;
