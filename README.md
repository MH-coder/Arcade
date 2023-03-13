# Arcade Studio
> Cloud based WebGL editor.

### Installation
- Rename .env.example file to .env and add environmental values .. e.g POSTGRES_URI
- Install the dependencies and devDependencies and start the server with the following.
```sh
npm i
npm run build
npm start # or nodemon
```
### Software tools & frameworks :
- PostgreSQL Database
- NodeJS & ExpressJS
- pug template engine


# SETUP ARCADE STUDIO ON LOCAL ENVIRONMENT

- Install docker on the system
- Pull the latest postgres image from docker hub
- Start a new container with that image on port 5432
- Download pg4Admin or any other postgres GUI tool compatible with the OS
- Connect the DB with appropriate username, password
- Execute the attached script to create the arcade db in your local environment.
- The DB setup is now complete
- Open the arcade studio project in VS Code
- Replace the db connection config to :
- POSTGRES_URI=postgres://postgres:1234@host.docker.internal:5432/postgres
- PG_DATABASE=postgres
- PG_USERNAME=postgres
- PG_PASSWORD=1234
- PG_HOST="host.docker.internal"
- PG_PORT=5432
- Where the details are: postgres://<username>:<password>@<host>:<port>/<database_name>
- Use the command “docker build -t <image-name> .” to build the project image
- After the image is built run the project with the desired port e.g. 80
- The application will be available on http://localhost 