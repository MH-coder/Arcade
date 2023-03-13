
git pull origin develop

# Migrate
# NODE_ENV=development npx sequelize-cli db:migrate

# npm run build

# Required on recurring build & updates
# Restart App
pm2 restart dev-app

# To freeze a process list for automatic respawn
pm2 save