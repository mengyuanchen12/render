let path = require('path');
let fs = require('fs');

let PostHandler = function (req, res) {
    this.prop = {
        req: req,
        res: res
    };
};

PostHandler.prototype = {
    handle: function () {
        let service = this.prop.req.params.service;
        let action = this.prop.req.params.action;
        let filepath = path.join(__dirname, '..', 'service', service + '.js');
        if (!fs.existsSync(filepath))
            return this.output(404);

        let Service = require(filepath);
        if (!Service[action])
            return this.output(404);

        Service[action](this.prop.req.body, (err, result) => this.output(err, result));
    },
    output: function (err, result) {
        console.log(new Date().toLocaleString(),
            ['', this.prop.req.params.service, this.prop.req.params.action].join('/'),
            err && err || 'success');

        if (err == 404)
            return this.prop.res.sendStatus(404);

        this.prop.res.json({
            err: err,
            data: result
        });
    }
};

module.exports = PostHandler;