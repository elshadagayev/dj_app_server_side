const { DJ, Rooms } = require("../models")
const API = require("./api")
const crypto = require("crypto")

class ApiRoute extends API {
    constructor(app) {
        super()
        this.app = app;

        this.createDJRoutes()
        this.createClientRoutes()
    }

    createDJRoutes () {
        this.app.get('/api/dj/rooms', (req, res) => this.getRooms(req, res))
        this.app.post('/api/dj/register', (req, res) => this.registerDJ(req, res))
        this.app.post('/api/dj/auth', (req, res) => this.authDJ(req, res))
        this.app.post('/api/dj/rooms/create', (req, res) => this.createRoom(req, res))
        this.app.get('/api/dj/room', (req, res) => this.getRoom(req, res));
    }

    createClientRoutes () {
        this.app.post('/api/client/auth', (req, res) => this.authClient(req, res))
        this.app.get('/api/client/songs', (req, res) => this.getClientSongs(req, res))
        this.app.get('/api/client/songs/all', (req, res) => this.getAllSongs(req, res))
        this.app.post('/api/client/songs/add', (req, res) => this.addClientSong(req, res))
        this.app.post('/api/client/songs/remove', (req, res) => this.removeClientSong(req, res))
        this.app.post('/api/client/songs/like', (req, res) => this.likeSong(req, res))
        this.app.post('/api/client/songs/dislike', (req, res) => this.dislikeSong(req, res))
    }

    likeSong(req, res) {
        try {
            const { songID, token, clientID } = req.body;
            Rooms.likeSong(token, clientID, songID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not like song"))
                res.json(this.successResponse("OK"));
            });
        } catch (E) {
            res.json(this.errorResponse(E))
        }
    }

    dislikeSong(req, res) {
        try {
            const { songID, token, clientID } = req.body;
            Rooms.dislikeSong(token, clientID, songID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not dislike song"))
                res.json(this.successResponse("OK"));
            });
        } catch (E) {
            res.json(this.errorResponse(E))
        }
    }

    addClientSong(req, res) {
        try {
            const { songID, token, clientID } = req.body;
            Rooms.addSong(token, clientID, songID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not add song"))
                res.json(this.successResponse("OK"));
            });
        } catch(E) {
            res.json(this.errorResponse(E))
        }
    }

    removeClientSong(req, res) {
        try {
            const { songID, token, clientID } = req.body;
            Rooms.removeSong(token, clientID, songID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not remove song"))
                res.json(this.successResponse(resp));
            });
        } catch(E) {
            res.json(this.errorResponse(E))
        }
    }

    getClientSongs (req, res) {
        try {
            const { token, clientID } = req.query;

            Rooms.getClientSongs(token, clientID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not get songs"))
                res.json(this.successResponse(resp));
            })
        } catch (E) {
            res.json(this.errorResponse(E))
        }
    }

    getAllSongs (req, res) {
        try {
            const { token, clientID } = req.query;

            Rooms.getAllSongs(token, clientID, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse("Could not get songs"))
                res.json(this.successResponse(resp));
            })
        } catch (E) {
            res.json(this.errorResponse(E))
        }
    }

    createRoom (req, res) {
        try {
            const { password, name, dj } = req.body;

            if(!password || !password.trim())
                return res.json(this.errorResponse("Password is required"))

            DJ.findOne({
                token: dj
            }).then((resp) => {
                const room = Rooms.save({
                    password, name, dj: resp.id
                }).save((err, resp) => {
                    if(err)
                        switch(err.code) {
                            case 11000:
                                return res.json(this.errorResponse("This room exists in our database. Type another email"))
                            default:
                                return res.json(this.errorResponse(err.errmsg))
                        }
                        
                        res.json(this.successResponse({
                            id: resp._id,
                            token: resp.token
                        }))
                })
            }).catch(err => {
                res.json(this.errorResponse(err))
            })
        } catch(E) {
            res.json(this.errorResponse(E));
        }
    }

    getRoom (req, res) {
        try {
            let { room_id, token } = req.query;
            token = token ? token.replace(' ', '+') : "";
            
            if(!token)
                return res.json(this.successResponse([]));
            
            DJ.findOne({
                token
            }).then(resp => {
                Rooms.findRoom(room_id).then(resp => {
                    res.json(this.successResponse(resp));
                }).catch(err => {
                    res.json(this.errorResponse(err));
                });
            }).catch(err => {
                res.json(this.errorResponse(err))
            })
        } catch(E) {
            res.json(this.errorResponse(E))
        }
    }

    getRooms (req, res) {
        try {
            let { token } = req.query;
            token = token ? token.replace(' ', '+') : "";
            if(!token)
                return res.json(this.successResponse([]));

            DJ.findOne({
                token
            }).then(resp => {
                Rooms.findRooms({
                    dj: resp._id
                }).then(resp => {
                    res.json(this.successResponse(resp));
                }).catch(err => {
                    res.json(this.errorResponse(err));
                });
            }).catch(err => {
                res.json(this.errorResponse(err))
            })
        } catch (E) {
            res.json(this.errorResponse(E))
        }
    }

    registerDJ (req, res) {
        try {
            const { email, password, retypePassword } = req.body;

            if(!password.trim())
                return res.json(this.errorResponse("Password is required"))
            
            if(password !== retypePassword)
                return res.json(this.errorResponse("Retype password correctly"))

            const dj = DJ.save({
                email,
                password
            }).save((err, resp) => {
                if(err)
                    switch(err.code) {
                        case 11000:
                            return res.json(this.errorResponse("This email exists in our database. Type another email"))
                        default:
                            return res.json(this.errorResponse(err.errmsg))
                    }
                    
                    res.json(this.successResponse({
                        id: resp._id,
                        email: resp.email,
                        token: resp.token
                    }))
            })
        } catch(E) {
            res.json(this.successResponse(E))
        }
    }

    authDJ (req, res) {
        try {
            const { email, password } = req.body;
            DJ.auth({
                email, password
            }).then(resp => {
                if(!resp)
                    return res.json(this.errorResponse("Email or password is not correct"))
                res.json(this.successResponse(resp))
            }).catch(err => {
                res.json(this.errorResponse("Email or password is not correct"))
            });
        }catch(E) {
            res.json(this.errorResponse(E))
        }
    }

    authClient (req, res) {
        try {
            const { password, full_name } = req.body;
            Rooms.authClient(password, full_name, (err, resp) => {
                if(err)
                    return res.json(this.errorResponse(err))
                
                res.json(this.successResponse(resp))
            })
        } catch (E) {
            res.json(this.errorResponse("Password is incorrect. Try it again"))
        }
    }

}

module.exports = ApiRoute