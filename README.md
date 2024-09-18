# mono-test-api
Mono Test API



&nbsp;


### Dependencies
- Node >=20.10.0
- MongoDB 7.x
- Redis 7.x


&nbsp;

## Cloning the Repository
Open your Terminal, and type:
`$ git clone https://github.com/django102/mono-test-api.git`



## Commands
1. `yarn` - Installs all dependencies
2. `yarn test` - Run all tests currently available in the [test](test) folder
3. `yarn build` - Generates all JavaScript files from the TypeScript sources
4. `yarn dev` - run the application for development in the local development environment. It starts the application using Nodemon which restarts the server each time a change is made to a file
5. `yarn start` - Build and Run the application as you will on a production server
6. `yarn lint` - Runs linting.


&nbsp;

### Configuration
Copy and rename `env.example` to `.env` and `.env.test`. Configure the remainder of variables as required.


&nbsp;


### Running the application

- `cd` into your new `mono-test-api` directory
- Install the dependencies

  ```bash
    npm install yarn -g
    $ yarn
  ```

- Install nodemon

  ```bash
  $ yarn add -g nodemon
  ```

- Run the application

  ```bash
  $ yarn dev
  ```

- Access the frontend on your browser on `http://localhost:80`

&nbsp;
