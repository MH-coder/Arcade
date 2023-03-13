const { User } = require("../models");

module.exports = {
  createUser: (data) => {
    return User.findOne({ where: { email: data.email } }).then(
      (existingUser) => {
        if (existingUser) {
          return null;
        }
        const user = new User({
          email: data.email,
          password: data.password,
        });
        return user.save();
      }
    );
  },
};
