module.exports = {
    apps: [
      {
        name: 'tg_tonco_bot', 
        script: 'dist/app.js', 
        env: {
          NODE_ENV: 'development', 
        },
        env_production: {
          NODE_ENV: 'production', 
        },
      },
    ],
  };
  