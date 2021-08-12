const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');

const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');
const isAuth = require('./middleware/is-auth');

const app = express();

// app.use(bodyParser.json());

app.use(isAuth);

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphQlSchema,
    rootValue: graphQlResolvers,
    graphiql: true
  })
);
var mongoDB = 'mongodb://127.0.0.1:27017/GraphQLAuth';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('debug', true);
app.listen(3002);
console.log("Server listening on: ", 3002);
// mongoose
//   .connect(
//     `mongodb://localhost:27017/GraphQLDemo`
//   )
//   .then(() => {
//     app.listen(3001);
//     console.log("Server listening on: ", 3000);
//   })
//   .catch(err => {
//     console.log(err);
//   });