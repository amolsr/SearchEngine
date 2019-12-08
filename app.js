const path = require('path');
const express = require('express');
const logger = require('./middleware/logger');
const app = express();

app.set('view engine', 'ejs');
app.use(logger);
app.use('/Search' , require('./routes/api/Search'));
app.use(express.static(path.join(__dirname,'public')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
