console.log("Starting Server");

const express = require('express');
const app = express();
const port = 3000;

const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'mysql',
  user: 'ucfnsjg',
  password: 'ucfnsjg',
  database: 'ucfnsjg'
});

connection.connect((err) => {
  if (err) {
    console.error('An error occurred while connecting to the DB');
    throw err;
  }
  console.log('Connected to the DB');
});

app.get('/', (req, res) => {
  res.send("Hello, World! - I'm here hey val." );
});

app.get('/healthcheck', (req, res) => {
  res.send("OK" );
});


router.get('/honeypot-data', async (req, res) => {
  try {
      // 读取 JSON 文件
      const data = await fs.readFile(
          path.join(__dirname, '../data/cleaned_data.json'),
          'utf8'
      );
      res.json(JSON.parse(data));
  } catch (error) {
      console.error('Error reading data:', error);
      res.status(500).json({ error: 'Failed to load data' });
  }
});

module.exports = router; 



// Connect to MySQL Database and get userdata from the user table render as JSON
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.error('An error occurred while executing the query');
      throw err;
    }
    console.log("Get Users");
    res.json(rows);
  });
}); 

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});