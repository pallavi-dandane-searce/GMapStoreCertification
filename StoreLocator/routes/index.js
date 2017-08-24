var express = require('express');
var router = express.Router();
var path = require('path');
var isArray = require('isarray');
var https = require('https');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, '../', 'views', 'index.html'));
});

router.get('/stores', function(req, res){
    var query = req.conn.query('SELECT * FROM stores',function(err,rows){

        if(err){
            console.log(err);
            return ("Mysql error, check your query");
        }

        res.json(rows);

    });
});

module.exports = router;