const crypto = require("crypto")

module.exports = (mongoose) => {
    const encrypt = (data) => {
        return crypto.createHash('sha256').update(data).digest('base64')
    }
    
    const DJ = mongoose.Schema({
        name: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (v) => {
                    return /^.+$/gi.test(v);
                },
                message: "{VALUE} is not a valid room name"
            }
        },
        password: {
            type: String,
            required: true,
            unique: true
            /*set: (v) => {
                return encrypt(v)
            }*/
        },
        dj: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'djs',
        },
        clients: Array,
        songs: Array,
        token: {
            type: String, 
            default: () => {
                return encrypt(Date.now().toString() + this.password)
            }
        }
    })

    const model = mongoose.model('rooms', DJ);

    const findRooms = (obj) => {
        return model.find(obj);
    }

    const findRoom = (roomId) => {
        return model.findById(roomId);
    }

    const authClient = (password, full_name, callback) => {
        const clientID = encrypt(Date.now() + Math.random() + full_name)
        model.findOne({
            password
        }).then(resp => {
            let { clients, _id, token } = resp;
            clients = clients instanceof Array ? clients : []
            clients.push({
                clientID,
                full_name,
                spotify_token: ""
            });

            model.findByIdAndUpdate(resp._id, {
                clients
            }).then(resp => {
                callback(null, {
                    id: resp._id,
                    token: resp.token,
                    clientID: clientID,
                    dj: resp.dj
                })
            })
        }).catch(err => {
            callback(err, null)
        })
    }

    const save = (obj) => {
        return new model(obj);
    }

    return {
        authClient,
        save,
        findRooms,
        findRoom
    }
}