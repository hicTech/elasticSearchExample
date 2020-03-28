const { Client } = require('@elastic/elasticsearch')
const client = new Client({
  node: 'http://localhost:9200'
})

async function create () {

  await client.indices.create({
    index: 'dati-strutturati',
    body: {
      mappings: {
        properties: {
          url: { type: 'String' },
          anno: { type: 'String' },
          tipo_formalita: { type: 'String' },
          conservatoria: { type: 'String' },
          reg_gen: { type: 'String' },
          reg_par: { type: 'String' },
          repertorio: { type: 'String' },
          notaio: {type: 'String'}
        }
      }
    }
  }, { ignore: [400] })
}

async function load () {

  const docs = require('./datistrutturati.json');
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
          } else { 
              console.log("Successfully imported %s", docs.length); 
          } 
  }); 
}

create().catch(console.log)
load().catch(console.log)