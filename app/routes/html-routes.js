const path = require("path")

class HtmlRoute {
    constructor(app) {
        this.app = app;

        this.createReactRoutes();
    }

    createReactRoutes () {
        this.app.get('*', (req, res) => {
            console.log(`${__dirname}/../../static/index.html`);
            res.sendFile(path.join(__dirname, '/../../client/static/index.html'));
        })
    }
}

module.exports = HtmlRoute