let path = require('path');
let fs = require('fs');

let GetHandler = function (req, res) {
    this.prop = {
        req: req,
        res: res
    };
};

GetHandler.prototype = {
    handle: function () {
        let service = this.prop.req.params.service;
        let action = this.prop.req.params.action;
        let filepath = path.join(__dirname, '..', 'service', service + '.js');
        let page = path.join(__dirname, '..', 'views', service, action + '.ejs');
        if (!fs.existsSync(page))
            return this.output(404);

        if (!fs.existsSync(filepath))
            return this.output(null, page, {});

        let Service = require(filepath);
        if (!Service[action])
            return this.output(null, page, {});

        Service[action](this.prop.req.query, (err, result) => this.output(err, page, result));
    },
    output: function (err, page, result) {
        console.log(new Date().toLocaleString(),
            ['', this.prop.req.params.service, this.prop.req.params.action].join('/'),
            err && err || 'success');

        if (err == 404) {
            let errPage = path.join(__dirname, '..', 'views', 'page404.ejs');
            return this.prop.res.render(errPage, (err, html) => {
                this.prop.res.send(html);
            });
        }

        this.prop.res.render(page, result, (err, html) => {
            this.prop.res.send(html);
        });
    }
};

module.exports = GetHandler;