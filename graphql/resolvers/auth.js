const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { dateToString } = require('../../helpers/date');
const { transformUser } = require('./merge');

module.exports = {

  // 1. GraphQL API for User creation - registration
  register: async args => {
    try {
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser) {
        throw new Error('User already exists.');
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        email: args.userInput.email,
        password: hashedPassword,
        firstName: args.userInput.firstName,
        lastName: args.userInput.lastName,
        active: args.userInput.active,
        createdDate: dateToString(args.userInput.createdDate),
        role: args.userInput.role
      });

      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id, createdDate: dateToString(user._doc.createdDate) };
    } catch (err) {
      throw err;
    }
  },
  // 2. GraphQL API for User login after registration successfully done - login
  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email, active: true });
    if (!user) {
      throw new Error('User does not exist or deactivated!');
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Password is incorrect!');
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'somesupersecretkey',
      {
        expiresIn: '1h'
      }
    );
    return { userId: user.id, token: token, tokenExpiration: 1 };
  },
  // 3. GraphQL API to get user profile based on token used to Authorize - getMyProfile
  getMyProfile: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      throw new Error('User does not exist!');
    }
    else {
      return { ...user._doc, createdDate: dateToString(user._doc.createdDate) };
    }
  },
  // 4. GraphQL API to change user password - changePassword
  changePassword: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      throw new Error('User does not exist!');
    }
    else {
      if (!args.passwordInput.currentPassword) throw new Error('Please enter valid current password!');
      if (!args.passwordInput.newPassword) throw new Error('Please enter valid new password!');
      if (!args.passwordInput.confirmPassword) throw new Error('Please enter valid confirm password!');
      const { currentPassword, newPassword, confirmPassword } = args.passwordInput;

      const isMatch = await bcrypt.compare(currentPassword, user.password)
      if (isMatch) {
        if (newPassword === confirmPassword) {
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          let updatePassword = await User.findByIdAndUpdate({ _id: req.userId }, { password: hashedPassword });
          if (updatePassword) {
            return { email: user.email, newPassword: newPassword, message: "You have successfully changed your password" }
          }
          else {
            return { email: user.email, newPassword: null, message: "Your password has not been changed" }
          }
        } else {
          throw new Error("The passwords don't match");
        }
      } else {
        throw new Error("Incorrect current password");
      }
    }
  },
  // 5. GraphQL API to update own profile - updateProfile
  updateProfile: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      throw new Error('User does not exist!');
    }
    else {
      // if (args.profileInput.email && args.profileInput.email != null) throw new Error('Use register with new email instead!');
      // if (args.profileInput.password && args.profileInput.password != null) throw new Error('Use change password instead!');

      let updateProfile = await User.findByIdAndUpdate({ _id: req.userId }, { ...args.profileInput });
      if (updateProfile) {
        return { ...updateProfile._doc, message: "Successfully updated profile" }
      }
      else {
        return { ...updateProfile._doc, message: "Failed to update profile" }
      }
    }
  },
  // 6. GraphQL API to update own profile - updateProfile
  deactivateProfile: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const user = await User.findOne({ _id: req.userId });
    if (!user) {
      throw new Error('User does not exist!');
    }
    else {
      let updateProfile = await User.findByIdAndUpdate({ _id: req.userId }, { active: false });
      if (updateProfile) {
        return { message: "Profile deactivated!" }
      }
      else {
        return { message: "Failed to deactivate profile!" }
      }
    }
  },
  registeredUsers: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const where = args.filter
      ? {
        $or: [
          { firstName: { $regex: args.filter, $options: "i" } },
          { lastName: { $regex: args.filter, $options: "i" } }
        ],
      }
      : {};
    let findObj = {};
    if (args.first) {
      findObj = { limit: args.first }
    }
    if (args.page && args.first) {

      findObj.skip = (args.page - 1) * args.first;
    }
    const users = await User.find(where, {}, findObj);
    if (users.length <= 0) {
      throw new Error('No record found');
    }
    else {
      return users.map(user => {
        return transformUser(user);
      });
    }
  }
};
