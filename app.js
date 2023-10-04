const express = require('express')
const app = express()
const url = require('url')
const ejs = require('ejs')
const fs = require('fs/promises')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const storage = multer.memoryStorage() 
const upload = multer({ storage: storage })
const port = 3000

// Configurar direcció ‘/’ 


// Publicar arxius carpeta ‘public’ 
app.use(express.static('public'))

// Configurar el motor de plantilles
app.set('view engine', 'ejs')


app.get('/item', getItem)
  async function getItem (req, res) {
  let query = url.parse(req.url, true).query;
  try {
  // Llegir el fitxer JSON
  let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8'})
  console.log(dadesArxiu)
  let dades = JSON.parse(dadesArxiu)
  console.log(dades)
  // Buscar la nau per nom
  let infoProd = dades.find(producto => (producto.id == query.id))
  if (infoProd) {
  // Retornar la pàgina segons la nau trobada
  // Fa servir la plantilla 'sites/item.ejs'
  res.render('sites/item', { infoProd: infoProd })
  } else {
  res.send('Paràmetres incorrectes')
  }
  } catch (error) {
  console.error(error)
  res.send('Error al llegir el fitxer JSON')
  }
}


// Activar el servidor
app.listen(port, appListen)
function appListen () {
  console.log(`Example app listening on: http://localhost:${port}`)
}

// Configurar direcció ‘/llistat’ i paràmetres URL
app.get('/', getSearch)
async function getSearch (req, res) {
  let query = url.parse(req.url, true).query;
  let noms = []
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)
    if (query.country) {
      // 'noms' conté un array amb els noms de les naus
      noms = llista.map(producto => { return producto.nombre })
      res.render('sites/search', { llista: noms })
    } else if (query.word) {
      llista = dades.filter(producto => ((producto.descripcion).toLowerCase().indexOf(query.word.toLocaleLowerCase()) != -1))
      noms = llista.map(producto => { return producto.nombre })
      res.render('sites/search', { llista: noms })
    } else {
      // 'noms' conté un array amb els noms de totes les naus ‘
      noms = dades.map(producto => { return producto.nombre })  
      res.render('sites/search', { llista: noms })
    }
    } catch (error) {
    console.error(error)
    res.send('Error al llegir el fitxer JSON')
  }

  }

app.get('/addItem', addItemR)
  async function addItemR (req, res) {
        res.render('sites/addItem')
}
  
app.post('/addItem', upload.array('files'), addItem)
async function addItem (req, res) {
  let arxiu = "./private/productes.json"
  let postData = await getPostObject(req)
  console.log("dddd")
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile(arxiu, { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)

    // Guardem la imatge a la carpeta 'public' amb un nom únic
    if (postData.files && postData.files.length > 0) {
      let fileObj = postData.files[0];
      const uniqueID = uuidv4()
      const fileExtension = fileObj.name.split('.').pop()
      let filePath = `${uniqueID}.${fileExtension}`
      await fs.writeFile('./public/' + filePath, fileObj.content);
      // Guardem el nom de l'arxiu a la propietat 'imatge' de l'objecte
      postData.imatge = filePath;
      // Eliminem el camp 'files' perquè no es guardi al JSON
      delete postData.files;
    }
    dades.push(postData) // Afegim el nou objecte (que ja té el nou nom d’imatge)
    let textDades = JSON.stringify(dades, null, 4) // Ho transformem a cadena de text (per guardar-ho en un arxiu)
    await fs.writeFile(arxiu, textDades, { encoding: 'utf8'}) // Guardem la informació a l’arxiu
    res.send(`S'han afegit les dades.`)
  } catch (error) {
    console.error(error)  
    res.send('Error al afegir les dades')
  }
  
}

async function getPostObject (req) {
  return new Promise(async (resolve, reject) => {
    let objPost = { };
    // Process files
    if (req.files.length > 0) { objPost.files = [] }
    req.files.forEach(file => {
      objPost.files.push({
        name: file.originalname,
        content: file.buffer
      })
    })
    // Process other form fields
    for (let key in req.body) {
      let value = req.body[key]
      if (!isNaN(value)) { // Check if is a number (example: "2ABC" is not a 2)
        let valueInt = parseInt(value)
        let valueFlt = parseFloat(value)
        if (valueInt && valueFlt) {
          if (valueInt == valueFlt) objPost[key] = valueInt
          else objPost[key] = valueFlt
        }
      } else {
        objPost[key] = value
      }
    }
    resolve(objPost)
    })  
}


  

app.get('/edit', editItem)
async function editItem (req, res) {
  let query = url.parse(req.url, true).query;
  let noms = []
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)
    if (query.country) {
      // 'noms' conté un array amb els noms de les naus
      noms = llista.map(producto => { return producto.nombre })

      res.render('sites/search', { llista: noms })
    } else if (query.word) {
      llista = dades.filter(producto => ((producto.descripcion).toLowerCase().indexOf(query.word.toLocaleLowerCase()) != -1))
      noms = llista.map(producto => { return producto.nombre })
      res.render('sites/search', { llista: noms })
    } else {
      // 'noms' conté un array amb els noms de totes les naus ‘
      noms = dades.map(producto => { return producto.nombre })  
      res.render('sites/search', { llista: noms })
    }
    } catch (error) {
    console.error(error)
    res.send('Error al llegir el fitxer JSON')
  }
  }