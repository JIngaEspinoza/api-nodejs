// server.js
const express = require('express'); // Importa Express
const sql = require('mssql');
const app = express(); // Crea una aplicación Express
const port = 3000; // El puerto en el que se ejecutará el servidor

// Configuración de la conexión a la base de datos SQL Server
const config = {
  user: 'sa',  // Reemplaza con tu usuario de SQL Server
  password: '123456',  // Reemplaza con tu contraseña de SQL Server
  server: 'LOCALHOST',  // Dirección del servidor SQL Server (usa la IP si no es localhost)
  database: 'DB',  // Reemplaza con el nombre de tu base de datos
  options: {
    encrypt: false,  // Establecer como true si usas una conexión cifrada
    trustServerCertificate: true,  // Establecer como true para evitar problemas con certificados en entornos locales
  }
};

// Middleware para parsear el cuerpo de las solicitudes en formato JSON
app.use(express.json());

//const debug = require('debug')('mi-api'); // Definir el espacio de nombres

// Ruta para ejecutar el procedimiento almacenado
app.get('/api/Consultas/NroExpediente', async (req, res) => {
  //debugger;
  try {
    // Conectar a la base de datos SQL Server
    await sql.connect(config);

    // Ejecutar el procedimiento almacenado
    const result = await sql.query`EXEC Listar_Documentos_ExpedienteSGDApi @DO_EXPE_CODI = ${req.query.codiexp}, @DO_PERI = ${req.query.periodo}`;

    // Convertir cada propiedad del resultado a una cadena
    const resultAsString = result.recordset.map(row => {
      const rowAsString = {};
      for (let key in row) {
        // Asegurarse de convertir el valor a cadena
        rowAsString[key] = String(row[key]);
      }
      return rowAsString;
    });

    // Enviar la respuesta con los resultados
    res.json(resultAsString);  // Resultados de la ejecución del procedimiento almacenado
    
    //Diferencia tipo de datos int, cadena
    //res.json(result.recordset)

  } catch (err) {
    console.error('Error al ejecutar el procedimiento almacenado:', err);
    res.status(500).json({ error: 'Error al ejecutar el procedimiento almacenado' });
  } finally {
    // Cerrar la conexión
    await sql.close();
  }
});

app.post('/api/Consultas/InsertarExpediente', async (req, res) => {
  try {
    // Desestructuramos los datos enviados desde el cliente
    const { DOCODI, SGAPERI, SGAUNIDEJEC, SGACODI, SGATIPDOC } = req.body;

    // Verificar si todos los datos necesarios están presentes
    if (!DOCODI || !SGAPERI || !SGAUNIDEJEC || !SGACODI || !SGATIPDOC ) {
      return res.status(400).json({ error: 'Todos los parámetros son requeridos' });
    }

    // Conectar a la base de datos SQL Server
    await sql.connect(config);

    // Ejecutar el procedimiento almacenado para insertar un nuevo documento
    const result = await sql.query`
      EXEC SGDSGA_Nuevo
        @DO_CODI = ${DOCODI},
        @SGA_PERI = ${SGAPERI},
        @SGA_UNIDEJEC = ${SGAUNIDEJEC},
        @SGA_CODI = ${SGACODI},
        @SGA_TIPDOC = ${SGATIPDOC}
    `;

    // Si el procedimiento fue exitoso, devolver una respuesta de éxito
    res.status(201).json({ message: 'Documento insertado correctamente', data: result.recordset });

  } catch (err) {
    console.error('Error al insertar el documento:', err);
    res.status(500).json({ error: 'Error al insertar el documento' });
  } finally {
    // Cerrar la conexión
    await sql.close();
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

