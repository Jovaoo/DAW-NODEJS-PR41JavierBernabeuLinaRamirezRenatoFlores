const express = require('express')
const app = express()
const port = 3000
const url = require('url')
const ejs = require('ejs')
const fs = require('fs/promises')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const storage = multer.memoryStorage() 
const upload = multer({ storage: storage })
const bodyParser = require('body-parser');


// Configura body-parser para analizar datos JSON y datos de formularios
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


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
      noms = dades.map(producto => ({ id: producto.id, nombre: producto.nombre }));
      res.render('sites/search', { llista: noms });
    } else if (query.word) {
      noms = dades
        .filter(producto => producto.descripcion.toLowerCase().includes(query.word.toLowerCase()))
        .map(producto => ({ id: producto.id, nombre: producto.nombre }));
      res.render('sites/search', { llista: noms })
    } else {
      // 'noms' conté un array amb els noms de totes les naus ‘
      noms = dades.map(producto => ({ id: producto.id, nombre: producto.nombre }));
      res.render('sites/search', { llista: noms });
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
//******************************************************************* */

//edit

app.get('/edit/:id', async (req, res) => {
  const idToEdit = parseInt(req.params.id);
  
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
    let dades = JSON.parse(dadesArxiu)
    
    // Buscar el producto por su ID
    let editItem = dades.find(producto => producto.id === idToEdit);
    
    if (editItem) {

      // Renderizar la vista de edición y pasar los datos del producto
      res.render('sites/editItem', { producto: editItem });
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (error) {
    console.error(error);
    res.send('Error al leer el archivo JSON');
  }
});

app.post('/edit/:id', async (req, res) => {
  const idToEdit = parseInt(req.params.id);
  const updatedData = req.body; // Obtenemos los datos enviados en el formulario

  
  try {
    // Leer el archivo JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' });
    let dades = JSON.parse(dadesArxiu);
    
    // Buscar el producto por su ID
    const editItem = dades.find(producto => producto.id === idToEdit);
    
    if (editItem) {
      // Actualiza los datos del producto con los datos enviados en el formulario
      editItem.nombre = updatedData.nombre;
      editItem.precio = updatedData.precio;
      editItem.descripcion = updatedData.descripcion;
      editItem.imagen = updatedData.imagen;
      
      // Guarda los datos actualizados de vuelta en el archivo JSON
      let textDades = JSON.stringify(dades, null, 4);
      await fs.writeFile("./private/productes.json", textDades, { encoding: 'utf8' });
      
      // Redirige a la página de detalle del producto actualizado
      res.redirect('/item?id=' + idToEdit);
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (error) {
    console.error(error);
    res.send('Error al actualizar los datos');
  }
});

//delete

app.get('/delete/:id', async (req, res) => {
  const idToDelete = parseInt(req.params.id);
  
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' })
    let dades = JSON.parse(dadesArxiu)
    
    // Buscar el producto por su ID
    let deleteItem = dades.find(producto => producto.id === idToDelete);
    
    if (deleteItem) {

      // Renderizar la vista de edición y pasar los datos del producto
      res.render('sites/deleteItem', { producto: deleteItem });
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (error) {
    console.error(error);
    res.send('Error al leer el archivo JSON');
  }
});

app.post('/delete/:id', async (req, res) => {
  const idToDelete = parseInt(req.params.id);

  try {
    // Leer el archivo JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8' });
    let dades = JSON.parse(dadesArxiu);

    // Encontrar el índice del producto a eliminar
    const indexToDelete = dades.findIndex(producto => producto.id === idToDelete);

    if (indexToDelete !== -1) {
      dades.splice(indexToDelete, 1);

      
      let textDades = JSON.stringify(dades, null, 4);
      await fs.writeFile("./private/productes.json", textDades, { encoding: 'utf8' });

      
      res.redirect('/confirmacionEliminacion');
    } else {
      res.status(404).send('Producto no encontrado');
    }
  } catch (error) {
    console.error(error);
    res.send('Error al eliminar el producto');
  }
});

/*app.get('/edit', editItem)
async function editItem (req, res) {
  let query = url.parse(req.url, true).query;
  let noms = []
  try {
    // Llegir el fitxer JSON
    let dadesArxiu = await fs.readFile("./private/productes.json", { encoding: 'utf8'})
    let dades = JSON.parse(dadesArxiu)
    if (query.country) {
      // 'noms' conté un array amb els noms de les naus
      noms = dades.map(producto => { return producto.nombre })

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
  }*/