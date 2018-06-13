import { decode } from 'punycode';

var jwt = require('jwt-simple');
var secret = 'i am your father'
const MyCommonError = require('../Error/CommonError')

module.exports = {
    encode: function (payload) {
        return jwt.encode(payload, secret);
    },
    decode: function (token) {
        return jwt.decode(token, secret);
    },
    checkToken: function (token) {
        try {
            let payload = jwt.decode(token,secret);
            if (payload.phone &&  payload.expire) {
                if (payload.expire > Date.now())
                    return payload;
                else
                    throw new MyCommonError("登录已过期", "0004");
            }

            throw new MyCommonError("token认证失败", "0005");
        } catch (error) {
            if (error instanceof MyCommonError)
                throw error;
            else
                throw new MyCommonError("token认证失败", "0005");
        }
    },
    generatePayload: function (phone, roleID,index,jsIndex) {
        return { phone: phone, roleID: roleID, index: index, jsIndex: jsIndex, expire: Date.now() + 12 * 3600000 };
    }
}