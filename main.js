const error = require('./error.js');
const core = require('@actions/core')
const {GitHub, context} = require('@actions/github')
const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('request');

function findAsset(assets, name){
  for(var i in assets){
    if(assets[i].name == name) {
      return assets[i].url
    }
  }
  throw `${name} not found in assets`;
}

async function downloadAsset(url, token) {
  var filePath = path.join(os.tmpdir(), "asset.zip");
  const options = {
    url: url,
    headers: {
      'User-Agent': 'request',
      'Accept': 'application/octet-stream',
      'Authorization': `token ${token}`
    }
  };
  var stream = request(options).pipe(fs.createWriteStream(filePath))

  return new Promise((resolve) => {
    stream.on('finish', ()=>{ resolve(filePath) });
  });
}

async function main() {
  const fileName = core.getInput('file');
  const token = core.getInput('token');
  //const octokit = new GitHub(token);

  if (! context.payload.release) {
    core.warning("Not running action as a release, skipping.");
    return;
  }

  const release = context.payload.release;

  var assetUrl = findAsset(release.assets, fileName)
  var path = await downloadAsset(assetUrl, token)

  core.setOutput('path', path);
}

main().catch(error.handle);
