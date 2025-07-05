const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'bunbun_db'
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to XAMPP MySQL Database');
});

module.exports = connection;

