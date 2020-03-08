let express = require('express');
let bodyParser = require('body-parser');
let config = require('./config');
let GetHandler = require('./handler/get');
let PostHandler = require('./handler/post');

let app = express();

app.use(bodyParser.json({
    limit: 2000
}));

app.set('view engine', '.ejs');
app.set('views', __dirname + '/views');

app.post('/:service/:action', (req, res, next) => {
    let postHandler = new PostHandler(req, res);
    postHandler.handle();
    next();
});

app.get('/:service/:action', (req, res, next) => {
    let getHandler = new GetHandler(req, res);
    getHandler.handle();
    next();
});

app.all('*', (req, res) => {
    res.sendStatus(200);
});

app.listen(config.port, err => {
    console.log('listen: %s', config.port);
});