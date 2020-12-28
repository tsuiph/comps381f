const express = require('express');
const app = express();
const session = require('cookie-session');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const mongourl = "mongodb+srv://LaiSinUe:LaiSinUe@cluster0.yzbua.mongodb.net/Restaurants?retryWrites=true&w=majority";
const dbName = "Restaurants";
const assert = require('assert');
const fs = require('fs');
const formidable = require('formidable');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

var secretkey = 'obliviate'
app.use(session({
    name: 'session',
    keys: ['secretkey']
}));
app.set('view engine','ejs');

const users = new Array(
	{name: 'demo', password: ''},
	{name: 'student', password: ''}
);


app.get('/api/restaurant/name/:resName', (req,res) => {
	const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);
        var criteria = {};
        criteria[req.params.resName] = req.params.value;
        
            findDocument(db, criteria, (docs) => {
                client.close();
                res.status(200).type('json').json(restaurants).end();
  }); 
});         

});

app.get('/api/restaurant/borough/:borough', (req,res) => {
	const client = new MongoClient(mongourl);
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);
        var criteria = {};
        criteria[req.params.borough] = req.params.value;
        
            findDocument(db, criteria, (docs) => {
                client.close();
                res.status(200).type('json').json(restaurants).end();
  }); 
});         

});

app.get('/api/restaurant/cuisine/:cuisine', (req,res) => {
	const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
        const db = client.db(dbName);
        var criteria = {};
        criteria[req.params.cuisine] = req.params.value;
        
            findDocument(db, criteria, (docs) => {
                client.close();
                res.status(200).type('json').json(restaurants).end();
  }); 
});         

});

app.get('/', (req,res) => {
    res.redirect('/read');
});

app.get('/login', (req,res) => {
    res.status(200).render('login.ejs');
});

app.post('/login', (req,res) => {
    users.forEach((user) => {
        if (user.name == req.body.name && user.password == req.body.password) {
            req.session.authenticated = true;
            req.session.username = user.name;
        }
    });
    if (req.session.authenticated != true) {
    	res.redirect('/login');
    } else {
    	res.redirect('/read');
    }
});

app.get('/logout', (req,res) => {
    req.session = null;
    res.redirect("/login");
});

app.get('/read', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
        const db = client.db(dbName);
        findRestaurants(db,{},(restaurants) => {
            client.close();
            console.log('Disconnected MongoDB');
            res.render('read.ejs',{username:req.session.username,restaurants:restaurants});
        });
    });
});



app.get('/create', (req,res) => {
    res.render('create.ejs');
    res.end();
});

app.post('/create', (req,res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err,fields,files) => {
        var createres = {}; //insert new restaurant
	createres['resID'] = fields.resID;
	createres['resName'] = fields.resName;
        createres['borough'] = fields.borough || '';
        createres['cuisine'] = fields.cuisine || '';
        createres['address'] = {};
        createres['address']['street'] = fields.street || '';
        createres['address']['building'] = fields.building || '';
        createres['address']['zipcode'] = fields.zipcode || '';
        createres['address']['coord'] = [fields.lat || '',fields.long || ''];
        createres['grades'] = [fields.score,fields.user];
        createres['owner'] = req.session.username;
        if (files.photo.size == 0) {
            const client = new MongoClient(mongourl);
            client.connect((err) => {
                try {
                    assert.equal(err,null)
                } catch (err) {
                    res.status(500).end("MongoClient connect() failed!");
                }
                const db = client.db(dbName);
                createres['photo'] = '';
                createres['photo_mimetype'] = '';
                insertRestaurants(db,createres,(result) => {
                    client.close();
                    res.redirect('/read');
                });
            });
        } else {
            fs.readFile(files.photo.path, (err,data) => {
                const client = new MongoClient(mongourl);
                client.connect((err) => {
                    try {
                        assert.equal(err,null);
                    } catch (err) {
                        res.status(500).end("MongoClient connect() failed!");
                    }
                    const db = client.db(dbName);
                    createres['photo'] = new Buffer.from(data).toString('base64');
                    createres['photo_mimetype'] = files.photo.type;
                    insertRestaurants(db,createres,(result) => {
                        client.close();
                        res.redirect('/read');
                    });
                });
            });
        }
    });
});

app.get('/update', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
     console.log("Connected successfully to Mongodb");
        const db = client.db(dbName);
        var criteria = {};
        criteria['_id'] = ObjectID(req.query._id);
        findRestaurants(db,criteria,(restaurants) => {
            client.close();
            console.log('Disconnected MongoDB');
            console.log('Restaurant returned = ' + restaurants.length);
            res.render('update.ejs',{restaurants:restaurants});
        });
    });
});

app.post('/update', (req,res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err,fields,files) => {
        var updateres = {};
        updateres['resID'] = fields.resID;
        updateres['resName'] = fields.resName;
        updateres['borough'] = fields.borough || '';
        updateres['cuisine'] = fields.cuisine || '';
        updateres['address'] = {};
        updateres['address']['street'] = fields.street || '';
        updateres['address']['building'] = fields.building || '';
        updateres['address']['zipcode'] = fields.zipcode || '';
        updateres['address']['coord'] = [fields.lat || '',fields.long || ''];
        updateres['owner'] = req.session.username;
        if (files.photo.size == 0) {
            const client = new MongoClient(mongourl);
            client.connect((err) => {
                try {
                    assert.equal(err,null)
                } catch (err) {
                    res.status(500).end("MongoClient connect() failed!");
                }
                const db = client.db(dbName);
                findRestaurants(db,{_id:ObjectID(fields._id)},(restaurants) => {
                    updateres['grades'] = restaurants[0].grades;
                    updateres['photo'] = restaurants[0].photo;
                    updateres['photo_mimetype'] = restaurants[0].photo_mimetype;
                    updateRestaurants(db,fields._id,updateres,(result) => {
                        client.close();
                        res.redirect(`/detail?_id=${fields._id}`);
                    });
                });
            });
        } else {
            fs.readFile(files.photo.path, (err,data) => {
                const client = new MongoClient(mongourl);
                client.connect((err) => {
                    try {
                        assert.equal(err,null);
                    } catch (err) {
                        res.status(500).end("MongoClient connect() failed!");
                    }
                    const db = client.db(dbName);
                    findRestaurants(db,{_id:ObjectID(fields._id)},(restaurants) => {
                   updateres['grades'] = restaurants[0].grades;
                   updateres['photo'] = new Buffer.from(data).toString('base64');
                   updateres['photo_mimetype'] = files.photo.type;
                        updateRestaurants(db,fields._id,updateres,(result) => {
                            client.close();
                            res.redirect(`/detail?_id=${fields._id}`);
                        });
                    });
                });
            });
        }
    });
})


app.get('/rate', (req,res) => {
  const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
        const db = client.db(dbName);

        var rateres = {};
        rateres['_id'] = ObjectID(req.query._id);
        findRestaurants(db,rateres,(restaurants) => {
            client.close();
            console.log(restaurants[0].grades);
            res.render('rate.ejs',{restaurants:restaurants});
        });
    });
});

app.post('/rate', (req,res) => {
   const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
        const db = client.db(dbName);

        var grade = {};
        grade.score = req.body.rating;
        grade.user = req.session.username;
        addRating(db,req.body.r_id,grade,(result) => {
            client.close();
            res.redirect(`/detail?_id=${req.body.r_id}`);
        });
    });
});

app.get('/detail', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
     assert.equal(null, err);
        const db = client.db(dbName);
        var display = {};
        display['_id'] = ObjectID(req.query._id);
        findRestaurants(db,display,(restaurants) => {
            client.close();
            res.render('display.ejs',{restaurants:restaurants,session:req.session});
        });
    });
});

app.get('/map', (req,res) => {
    res.render('map.ejs', {
        lat: req.query.lat,
        lon: req.query.long,
        zoom: 15
    });
    res.end();
});


app.get('/delete', (req,res) => {
  const client = new MongoClient(mongourl);
  client.connect((err) => {
        assert.equal(null, err);
        const db = client.db(dbName);
        var delobj= {};
        delobj['_id'] = ObjectID(req.query._id);
        deleteRestaurants(db,delobj,(restaurants) => {
            client.close();
            res.redirect('/read');
        });
    });
});



app.get("/search", (req,res) => {
	res.status(200).render("search.ejs");	
});

app.post("/search", (req,res) => {
	const form = new formidable.IncomingForm(); 
	form.parse(req, (err, fields) => {
		var criteria = {};
		if(fields.resName)
			criteria['resName'] = fields.resName;
		if(fields.borough)
			criteria['borough'] = fields.borough;
		if(fields.cuisine)
			criteria['cuisine'] = fields.cuisine;

		const client = new MongoClient(mongourl, { useNewUrlParser: true });
        client.connect((err) => {
            assert.equal(null, err);
            const db = client.db(dbName);

            findRestaurants(db, criteria, (restaurants) => {
                client.close();
				res.status(200).render("searchResult.ejs",{restaurants:restaurants,resName:fields.resName,borough:fields.borough,cuisine:fields.cuisine});	
            });
        });
	});
});



app.get('/logout', (req,res) => {
    req.session = null; //clear login session
    res.redirect("/login");
});




const findRestaurants = (db,criteria,callback) => {
    const cursor = db.collection("restaurants").find(criteria);
    var restaurants = [];
    cursor.forEach((doc) => {
        restaurants.push(doc);
    }, (err) => {
        assert.equal(err,null);
        callback(restaurants);
    })
};

const insertRestaurants = (db,r,callback) => {
    db.collection('restaurants').insertOne(r,(err,result) => {
        assert.equal(err,null);
        console.log(JSON.stringify(result));
        callback(result);
    });
};

const updateRestaurants = (db,r_id,doc,callback) => {
    db.collection('restaurants').replaceOne({_id: ObjectID(r_id)},doc,(err,result) => {
        assert.equal(err,null);
        console.log(JSON.stringify(result));
        callback(result);
    });
}

const addRating = (db,r_id,grade,callback) => {
    db.collection('restaurants').updateOne({_id: ObjectID(r_id)},{$push:{grades:grade}},(err,result) => {
        assert.equal(err,null);
        console.log(JSON.stringify(result));
        callback(result);
    })
}

const deleteRestaurants = (db,r,callback) => {
    db.collection('restaurants').deleteOne(r,(err,result) => {
        assert.equal(err,null);
        console.log(JSON.stringify(result));
        callback(result);
    })
}

app.listen(process.env.PORT || 8099);
