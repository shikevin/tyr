var http = require('http');
var express = require ('express');
var path = require ('path');
var MongoClient = require ('mongodb').MongoClient;
var Server = require ('mongodb').Server;
var CollectionDriver = require ('./collectionDriver').CollectionDriver;

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.bodyParser());

var mongoHost  = 'localHost';
var mongoPort = 27017;
var collectionDriver;

var mongoClient = new MongoClient(new Server(mongoHost, mongoPort));
mongoClient.open (function(err, mongoClient) {
    if (!mongoClient) {
        console.error("Error! Exiting... Must start MongoDB first");
        process.exit(1);
    }

    var db = mongoClient.db("MyDatabase");
    collectionDriver =  new CollectionDriver(db);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/:collection', function(req, res) { //A
    var params = req.params; //B
    collectionDriver.findAll(req.params.collection, function(error, objs) { //C
        if (error) { res.send(400, error); } //D
        else {
            if (req.accepts('html')) { //E
                res.render('data',{objects: objs, collection: req.params.collection}); //F
            } else {
                res.set('Content-Type','application/json'); //G
                res.send(200, objs); //H
            }
        }
    });
});

app.get('/:collection/:entity', function(req, res) { //I
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.get(collection, entity, function(error, objs) { //J
            if (error) { res.send(400, error); }
            else { res.send(200, objs); } //K
        });
    } else {
        res.send(400, {error: 'bad url', url: req.url});
    }
});

app.post('/:collection', function(req, res) {
    var object = req.body;
    var collection = req.params.collection;
    collectionDriver.save (collection, object, function (err, docs) {
        if (err) {res.send(400,err); }
        else { res.send(201, docs); }
    });
});

app.put('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.update(collection, req.body, entity, function(error, objs) { //B
            if (error) { res.send(400, error); }
            else { res.send(200, objs); } //C
        });
    } else {
        var error = { "message" : "Cannot PUT a whole collection" };
        res.send(400, error);
    }
});

app.delete('/:collection/:entity', function(req, res) { //A
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
        collectionDriver.delete(collection, entity, function(error, objs) { //B
            if (error) { res.send(400, error); }
            else { res.send(200, objs); } //C 200 b/c includes the original doc
        });
    } else {
        var error = { "message" : "Cannot DELETE a whole collection" };
        res.send(400, error);
    }
});

app.use(function (req, res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});