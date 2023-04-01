// PM2 Ecosystem file
// https://pm2.keymetrics.io/docs/usage/application-declaration/#generate-configuration

module.exports = {
  apps: [{
    name: "ais-sender",
    script: "index.js",
    watch: false,
    watch_delay: 1000,
    env: {
      'NODE_ENV': 'production',
    },
    ignore_watch : [
      "node_modules",
      "logs"
    ],
    watch_options: {
      "followSymlinks": false
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: false
  }]
}
