const { buildSchema } = require('graphql');

module.exports = buildSchema(`

type User {
  _id: ID!
  email: String!
  password: String
  firstName: String
  lastName: String
  active: Boolean
  createdDate: String,
  role: String
}

type AuthData {
  userId: ID!
  token: String!
  tokenExpiration: Int!
}

type UserPassword {
  email: String!
  newPassword: String
  message: String
}

type Profile {
  _id: ID!
  email: String!
  password: String
  firstName: String
  lastName: String
  active: Boolean
  message: String
  createdDate: String
  role: String
}

type DeactiveUser {
  message: String
}
input UserInput {
  email: String
  password: String
  firstName: String
  lastName: String
  active: Boolean
  createdDate: String
  role: String
}

input PasswordInput {
  currentPassword: String
  newPassword: String
  confirmPassword: String
}

input ProfileInput{
  firstName: String
  lastName: String
  active: Boolean
}

input NameFilter {
  OR: [NameFilter!]
}
type RootQuery {
    login(email: String!, password: String!): AuthData!
    getMyProfile: User
    registeredUsers(filter: String, page: Int, first:Int): [User!]!
}

type RootMutation {
  register(userInput: UserInput): User!
  changePassword (passwordInput: PasswordInput): UserPassword!
  updateProfile (profileInput: ProfileInput): Profile!
  deactivateProfile: DeactiveUser!
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);
