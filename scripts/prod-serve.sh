git pull origin master

# Migrate
# NODE_ENV=production npx sequelize-cli db:migrate

# npm run build

# Only required on recurring build & updates
# Restart App
pm2 restart prod-app

# To freeze a process list for automatic respawn
pm2 save