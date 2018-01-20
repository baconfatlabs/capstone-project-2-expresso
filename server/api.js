const express = require('express');
const apiRouter = express.Router();

const employeesRouter  = require('./routes/employees.js');
apiRouter.use('/employees', employeesRouter);

const menusRouter = require('./routes/menus.js');
apiRouter.use('/menus', menusRouter);

module.exports = apiRouter;
