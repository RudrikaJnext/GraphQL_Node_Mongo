const { dateToString } = require('../../helpers/date');
const transformUser = user => {
    return {
        ...user._doc,
        _id: user.id,
        createdDate: dateToString(user._doc.createdDate)
    };
};

exports.transformUser = transformUser;