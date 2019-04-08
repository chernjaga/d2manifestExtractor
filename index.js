const Traveler = require('the-traveler').default;
const Manifest = require('the-traveler/build/Manifest').default;
const fs = require('fs');

const apiKey = require('./apiKey').key;
const traveler = new Traveler({apikey: apiKey});

const args = require('minimist')(process.argv.slice(2));
const lang = args.lang || 'en'

const sqlite3 = require('sqlite3');
const SqliteToJson = require('sqlite-to-json');
const exporter = new SqliteToJson({
  client: new sqlite3.Database('./manifest.content')
});

 
traveler.destiny2.getDestinyManifest().then(result => {
    traveler.destiny2.downloadManifest(result.Response.mobileWorldContentPaths[lang], './manifest.content').then(filepath => {
        const manifest = new Manifest(filepath);
        manifest.queryManifest('SELECT name FROM sqlite_master WHERE type="table"').then(queryResult => {
            let tablelNames = []
            for (let table of queryResult) {
                tablelNames.push(table.name);
                exporter.save(table.name, './manifestDb/' + table.name + '.json' , function(err) {
                    console.log(err);
                });
            }
            return tablelNames;
        })
        .then(function(names){
            for (let item in names) {
                prettify(names[item]);
            }
            
            function prettify (name) {
                let temp = require('./manifestDb/' + name + '.json');
                let output = {};
                let path = './manifestPrettifyed/' + lang;

                for (let item of temp) {
                    output[item.id] = JSON.parse(item.json);
                }

                
                if (!fs.existsSync('./manifestPrettifyed')) {
                    fs.mkdirSync('./manifestPrettifyed');
                }

                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path);
                }
                fs.createWriteStream(path + '/' + name + '.json').write(JSON.stringify(output));
            };
        })
        .catch(err => {
            console.log(err);
        });
    }).catch(err => {
        console.log(err);
    });
});

