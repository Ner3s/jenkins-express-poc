const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res, next) => {
  res.send({'Hello World': 'Olá Mundo'});
})

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
})