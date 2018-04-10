const crypto = require("crypto")
const EventEmitter = require("events")

const djEvent = new EventEmitter();
djEvent.setMaxListeners(0);

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

    const auth = (obj) => {
        return model.findOne(obj)
    }

    const save = (obj) => {
        return new model(obj);
    }

    const findOne = (obj) => {
        return model.findOne(obj)
    }

    const findById = (id) => {
        return model.findById(id)
    }

    return {
        auth,
        save,
        findOne,
        findById,
        events: djEvent
    }
}