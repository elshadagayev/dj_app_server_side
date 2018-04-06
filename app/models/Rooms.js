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

    const addSong = (roomToken, clientID, songID, callback) => {
        roomToken = roomToken.replace(' ', '+');
        clientID = clientID.replace(' ', '+');
        songID = songID.replace(' ', '+');

        model.findOne({
            token: roomToken
        }).then(res => {
            const clients = res.clients instanceof Array ? res.clients : [];
            const songs = res.songs instanceof Array ? res.songs : [];
            client = clients.find(el => {
                return el.clientID === clientID
            })

            if(!client)
                throw "You have no access to this room"
            if(!songs.find(el => {
                return el.songID === songID
            })) {
                songs.push({
                    clientID,
                    songID,
                    likes: 0,
                    dislikes: 0,
                });
            }

            model.findByIdAndUpdate(res._id, {
                songs
            }).then(res => {
                callback(null, res);
            }).catch(err => {
                callback(err, null);
            })
        })
    }

    const getClientSongs = (roomToken, clientID, callback) => {
        model.findOne({
            token: roomToken
        }).then(res => {
            if(!res)
                return callback("Could not find songs", null)
            let songs = res.songs;
            songs = songs.filter(el => {
                return el.clientID === clientID
            }).map(el => {
                const client = res.clients.find(client => {
                    return client.clientID === clientID
                })

                el.clientName = client.full_name
                return el;
            });

            callback(null, songs);
        }).catch(err => {
            callback(err, null);
        })
    }

    const getAllSongs = (roomToken, clientID, callback) => {
        model.findOne({
            token: roomToken
        }).then(res => {
            if(!res)
                return callback("Could not find songs", null)
            let songs = res.songs;
            let clients = res.clients;
            // check if client exists
            const client = clients.find(client => {
                return client.clientID === clientID
            })

            if(!client)
                return callback("You have no access to this room")

            songs.sort((a, b) => {
                const rateA = a.likes - a.dislikes;
                const rateB = b.likes - b.dislikes;
                return rateB - rateA
            })

            callback(null, songs);
        }).catch(err => {
            callback(err, null);
        })
    }

    const removeSong = (roomToken, clientID, songID, callback) => {
        roomToken = roomToken.replace(' ', '+');
        clientID = clientID.replace(' ', '+');
        songID = songID.replace(' ', '+');

        model.findOne({
            token: roomToken
        }).then(res => {
            let songs = res.songs instanceof Array ? res.songs : [];
            songs = songs.filter(el => {
                return !(el.songID === songID && el.clientID === clientID && !el.likes && !el.dislikes)
            })

            model.findByIdAndUpdate(res._id, {
                songs
            }).then(res => {
                callback(null, "OK")
            }).catch(err => {
                callback(err, null);
            })
        })
    }

    const likeSong = (roomToken, clientID, songID, callback) => {
        roomToken = roomToken.replace(' ', '+');
        clientID = clientID.replace(' ', '+');
        songID = songID.replace(' ', '+');

        model.findOne({
            token: roomToken
        }).then(res => {
            let songs = res.songs instanceof Array ? res.songs : [];
            songs = songs.map(el => {
                if(el.songID === songID && el.clientID !== clientID)
                    el.likes++;
                return el;
            })

            model.findByIdAndUpdate(res._id, {
                songs
            }).then(res => {
                callback(null, "OK")
            }).catch(err => {
                callback(err, null);
            })
        })
    }

    const dislikeSong = (roomToken, clientID, songID, callback) => {
        roomToken = roomToken.replace(' ', '+');
        clientID = clientID.replace(' ', '+');
        songID = songID.replace(' ', '+');

        model.findOne({
            token: roomToken
        }).then(res => {
            let songs = res.songs instanceof Array ? res.songs : [];
            songs = songs.map(el => {
                if(el.songID === songID && el.clientID !== clientID)
                    el.dislikes++;
                return el;
            })

            model.findByIdAndUpdate(res._id, {
                songs
            }).then(res => {
                callback(null, "OK")
            }).catch(err => {
                callback(err, null);
            })
        })
    }

    const save = (obj) => {
        return new model(obj);
    }

    return {
        authClient,
        save,
        findRooms,
        findRoom,
        addSong,
        removeSong,
        getClientSongs,
        getAllSongs,
        likeSong,
        dislikeSong,
    }
}