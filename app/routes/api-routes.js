const { DJ, Rooms } = require("../models")
const API = require("./api")
const crypto = require("crypto")

class ApiRoute extends API {
    constructor(app) {
        super()
        this.app = app;

        this.createDJRoutes()
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
    }

    createRoom (req, res) {
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
    }

    getRoom (req, res) {
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
    }

    getRooms (req, res) {
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
    }

    registerDJ (req, res) {
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
    }

    authDJ (req, res) {
        const { email, password } = req.body;
        DJ.auth(email, password, (err, resp) => {
            if(err)
                return res.json(this.errorResponse(err))
            
            res.json(this.successResponse(resp))
        });
    }

    authClient (req, res) {
        const { password } = req.body;
        Rooms.authClient(password, (err, resp) => {
            if(err)
                return res.json(this.errorResponse(err))
            
            res.json(this.successResponse(resp))
        });
    }

}

module.exports = ApiRoute