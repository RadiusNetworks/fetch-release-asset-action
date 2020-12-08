const error = require('./error.js');
const core = require('@actions/core')
const {GitHub, context} = require('@actions/github')
const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('request');

function findAsset(assets, re){
  list = []
  var regex = RegExp(re);
  for(var i in assets){
    if(regex.test(assets[i].name)) {
      list.push({
        url: assets[i].url,
        name: assets[i].name
      })
    }
  }
  if (list.length == 0) {
    throw `${name} not found in assets`;
  }

  return list;

}

async function downloadAsset(asset, token, dir) {
  var filePath = path.resolve(dir, asset.name);
  const options = {
    url: asset.url,
    headers: {
      'User-Agent': 'request',
      'Accept': 'application/octet-stream',
      'Authorization': `token ${token}`
    }
  };
  console.log(`Downloading ${asset.name}`);
  var stream = request(options).pipe(fs.createWriteStream(filePath))

  return new Promise((resolve) => {
    stream.on('finish', ()=>{ resolve(filePath) });
  });
}

function createDir(dir) {
  if (!dir) {
    dir = os.tmpdir();
  }
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  return dir
}

async function main() {
  const regex = core.getInput('regex');
  const token = core.getInput('token');
  const downloadPath = createDir(core.getInput('dir'));

  const octokit = new GitHub(token);
  if (! context.payload.release) {
    core.warning("Not running action as a release, skipping.");
    return;
  }
  const release = context.payload.release;

  //const octokit = new GitHub(process.env.GITHUB_TOKEN);
  //var response = await octokit.repos.getReleaseByTag({ owner: "RadiusNetworks", repo: "iris-ios", tag: "app-v0.1" })
  //var release = response.data

  var assets = findAsset(release.assets, regex)

  paths = [];
  for (var i in assets) {
    var newPath = await downloadAsset(assets[i], token, downloadPath)
    paths.push(newPath);
  }
  core.setOutput('asset_paths',paths.join("\n"));
  core.setOutput('dir',path.resolve(downloadPath));
}

main().catch(error.handle);
