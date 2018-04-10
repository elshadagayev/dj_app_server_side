const { DJ, Rooms } = require("../models")
const API = require("../routes/api")

class SocketRoutes extends API {
    constructor(io) {
        super();

        this.io = io

        this.createRoutes();
    }

    createRoutes () {
        this.io.on('connection', client => {
            // get client songs
            client.on('get_client_songs', data => this.getClientSongs(data, client))

            // get all songs
            client.on('get_all_songs', data => this.getAllSongs(data, client))

            // get rooms info for client
            client.on('get_room_general_info', data => this.getGeneralInfo(data, client))

            // get rooms info for dj
            client.on('get_dj_room_general_info', data => this.getDJGeneralInfo(data, client))

            // get rooms list for dj
            client.on('get_dj_rooms', data => this.getDJRooms(data, client))

            // check if room deleted
            client.on('room_deleted', data => this.checkIfRoomDeleted(data, client))
        })
    }

    checkIfRoomDeleted (data, client) {
        const checkIfRoomDeleted = () => {
            try {
                const { roomToken } = data;
                Rooms.findRooms({
                    token: roomToken
                }).then(resp => {
                    if(!resp || !resp.length)
                        client.emit('room_deleted', this.successResponse("OK"))
                }).catch(err => {
                    client.emit('room_deleted', this.successResponse(err));
                })
            } catch(E) {
                client.emit('room_deleted', this.successResponse(E));
            }
        }
        
        checkIfRoomDeleted();
        Rooms.events.on('room_deleted', () => {
            checkIfRoomDeleted();
        })
    }

    getClientSongs (data, client) {
        const getClientSongs = () => {
            try {
                const { token, clientID } = data;
                Rooms.getClientSongs(token, clientID, (err, resp) => {
                    if(err)
                        return client.emit('get_client_songs', this.errorResponse(err));
                    client.emit('get_client_songs', this.successResponse(resp));
                })
            } catch(E) {
                client.emit('get_client_songs', this.errorResponse(E));
            }
        }

        getClientSongs();
        Rooms.events.on('updated_songs', () => {
            getClientSongs();
        })
    }

    getAllSongs (data, client) {
        const getAllSongs = () => {
            try {
                const { token, clientID } = data;
                Rooms.getAllSongs(token, clientID, (err, resp) => {
                    if(err)
                        return client.emit('get_all_songs', this.errorResponse(err));
                    client.emit('get_all_songs', this.successResponse(resp));
                })
            } catch(E) {
                client.emit('get_all_songs', this.errorResponse(E));
            }
        }

        getAllSongs();
        Rooms.events.on('updated_songs', () => {
            getAllSongs();
        })
    }

    getGeneralInfo (data, client) {
        const getGeneralInfo = () => {
            try {
                const { roomToken, clientID } = data;
                Rooms.getGeneralInfo(roomToken, clientID, (err, resp) => {
                    if(err)
                        return client.emit('get_room_general_info', this.errorResponse(err));
                    client.emit('get_room_general_info', this.successResponse(resp));
                })
            } catch(E) {
                client.emit('get_room_general_info', this.errorResponse(E));
            }
        }

        getGeneralInfo();
        Rooms.events.on('get_room_general_info', () => {
            getGeneralInfo();
        })
    }

    getDJGeneralInfo (data, client) {
        const getGeneralInfo = () => {
            try {
                const { token, roomID } = data;
                DJ.findOne({
                    token
                }).then(dj => {
                    Rooms.getDJGeneralInfo(dj._id, roomID, (err, room) => {
                        if(err)
                            return client.emit('get_dj_room_general_info', this.errorResponse(err));
                        const resp = {
                            dj,
                            room
                        }
                        client.emit('get_dj_room_general_info', this.successResponse(resp));
                    })
                })
            } catch(E) {
                client.emit('get_dj_room_general_info', this.errorResponse(E));
            }
        }

        getGeneralInfo();
        Rooms.events.on('get_dj_room_general_info', () => {
            getGeneralInfo();
        })
    }

    getDJRooms (data, client) {
        const getRooms = () => {
            try {
                const { token } = data;
                DJ.findOne({
                    token
                }).then(resp => {
                    Rooms.findRooms({
                        dj: resp._id
                    }).then(resp => {
                        client.emit('get_dj_rooms', this.successResponse(resp));
                    }).catch(err => {
                        client.emit('get_dj_rooms', this.errorResponse(err));
                    });
                }).catch(err => {
                    client.emit('get_dj_rooms', this.errorResponse(err))
                })
            } catch(E) {
                client.emit('get_dj_rooms', this.errorResponse(E));
            }
        }

        getRooms();
        Rooms.events.on('get_dj_rooms', () => {
            getRooms();
        })
    }
}

module.exports = SocketRoutes