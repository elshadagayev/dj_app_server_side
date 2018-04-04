const crypto = require("crypto")

module.exports = (mongoose) => {
    const encrypt = (data) => {
        return crypto.createHash('sha256').update(data).digest('base64')
    }
    
    const DJ = mongoose.Schema({
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (v) => {
                    return /^.+@.+$/gi.test(v);
                },
                message: "{VALUE} is not a valid email address"
            }
        },
        password: {
            type: String,
            required: true,
            set: (v) => {
                return encrypt(v)
            }
        },
        spotify_token: String,
        token: {
            type: String, 
            default: () => {
                return encrypt(Date.now().toString() + this.password)
            }
        }
    })

    const model = mongoose.model('dj', DJ);

    const auth = (email, pass, callback) => {
        model.findOne({
            email
        }, (err, res) => {
            if(err)
                return callback("Email or password is not correct", res);
            
            const { email, password, token } = res;

            if(password !== encrypt(pass))
                return callback("Email or password is not correct")

            callback(null, {
                email, token
            })
        })
    }

    const save = (obj) => {
        return new model(obj);
    }

    const findOne = (obj, callback) => {
        return model.findOne(obj)
    }

    return {
        auth,
        save,
        findOne,
    }
}