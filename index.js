const { Client } = require('@elastic/elasticsearch');
const express = require( 'express' );
const bodyParser = require('body-parser')
const path = require( 'path' );
const _ = require('underscore')


const client = new Client({ node: 'http://localhost:9200' });

const app = express();

client.ping({}, { requestTimeout: 20000 }, (err, response) => {
    if (err) {
        console.error('Cluster OFFLINE' + err);
    } else {
        console.log('Cluster ONLINE');
    }   
   })

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());

app.set( 'port', process.env.PORT || 3001 );

app.use( express.static( path.join( __dirname, 'public' )));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(req, res){
  res.sendFile('index.html', {
     root: path.join( __dirname, 'views' )
   });
})


app.post('/search', function (req, res){
  var itemsProcessed = 0;
  let risposta = [] // risposta da inviare al client
  let arrjson = req.body
  arrjson.forEach(json =>{
  let must = [] // lo utilizzo per creare la query con piu parametri
  let propArray = _.keys(json)
    propArray.forEach(property => {
      if (json[property] != ""){
        obj = {}
        obj[property] = json[property].toLowerCase();
        must.push( {
            term : obj
        }
        )
      }
    })
    let body = {
      size: 1, // limita i miei risultati a 1 
      from: 0, 
      query: {
          bool: {
              must
           }
         },
    }

  client.search({index:'dati-strutturati', body:body})
  .then(results => {
    result = results.body.hits.hits[0] 
    risposta.push(result)
    itemsProcessed++;
    if(itemsProcessed === arrjson.length) {
      console.log(risposta)
      res.send(risposta)
    }
  })
  .catch(err=>{
    console.log(err)
    res.send([]);
  });
  })

})

app.post('/load', function (req,res){
  let docs = req.body
  var bulk = [];
  docs.forEach(doc =>{
    bulk.push({index:{
                  _index:"dati-strutturati", 
                  _type:"_doc",
                  _id: doc.url,
              }          
          })
    bulk.push(doc)
  })
  client.bulk({body:bulk}, function( err, response  ){ 
          if( err ){ 
              console.log("Failed Bulk operation", err)
              res.sendStatus(400)
          } else { 
              console.log("Successfully imported %s", docs.length); 
              res.sendStatus(201)
          } 
  }); 


})

app.listen( app.get( 'port' ), function(){
  console.log( 'Express server listening on port ' + app.get( 'port' ));
} );