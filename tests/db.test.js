const mysql = require('mysql2/promise');

describe('Prueba de base de datos: usuarios', () => {
  let connection;

  beforeAll(async () => {
    connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'Woody@702312', // cambia si tu contraseña es distinta
      database: 'ferramas', // ajusta el nombre si es diferente
    });
  });

  afterAll(async () => {
    await connection.end();
  });

  test('Insertar y consultar usuario', async () => {
    const correo = 'jest@correo.com';

    // Insertar usuario
    await connection.query(
      'INSERT INTO usuarios (nombre, usuario, correo, contrasena) VALUES (?, ?, ?, ?)',
      ['Jest Test', 'jestuser', correo, '123456']
    );

    // Consultar usuario insertado
    const [rows] = await connection.query(
      'SELECT * FROM usuarios WHERE correo = ?',
      [correo]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].usuario).toBe('jestuser');
    expect(rows[0].correo).toBe(correo);
  });
});
