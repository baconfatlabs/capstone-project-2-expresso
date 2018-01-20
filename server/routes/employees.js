const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateEmployeeId = (req, res, next) => {
  db.get('SELECT * FROM Employee WHERE id = $id', {
      $id: req.employeeId
      }, (error, row) => {
        if(row){
          next();
        }else{
          res.status(404).send();
        }

    });
};

const validateTimesheetId = (req, res, next) => {
  db.get('SELECT * FROM Timesheet WHERE id = $id', {
      $id: req.timesheetId
      }, (error, row) => {
        if(row){
          next();
        }else{
          res.status(404).send();
        }

    });
};

const validateEmployeeInput = (req, res, next) => {
  if(req.body.employee.hasOwnProperty('name') && req.body.employee.hasOwnProperty('position') && req.body.employee.hasOwnProperty('wage')){
    next();
  }else{
    res.status(400).send("Missing Fields");
  }
}

const validateTimesheetInput = (req, res, next) => {
  if(req.body.timesheet.hasOwnProperty('hours') && req.body.timesheet.hasOwnProperty('rate') && req.body.timesheet.hasOwnProperty('date')){
    next();
  }else{
    res.status(400).send("Missing Fields");
  }
}

employeesRouter.param('employeeId', (req, res, next, id) => {
  const employeeId = Number(id);
  if(employeeId){
    req.employeeId = employeeId + '';
    next();
  }else{
    res.status(404).send('Invalid number');
  }
});

employeesRouter.param('timesheetId', (req, res, next, id) => {
  const timesheetId = Number(id);
  if(timesheetId){
    req.timesheetId = timesheetId + '';
    next();
  }else{
    res.status(404).send('Invalid number');
  }
});

employeesRouter.get('', (req, res, next) => {
  db.all("SELECT * FROM Employee WHERE is_current_employee=1", (error, rows) => {
    res.send( {employees: rows} );
  });
});

employeesRouter.post('', validateEmployeeInput, (req, res, next) => {
  const newEmployee = req.body.employee;
  db.run('INSERT INTO Employee (name, position, wage) VALUES ($name, $position, $wage)',
      {
        $name: newEmployee.name,
        $position: newEmployee.position,
        $wage: newEmployee.wage
      },
      function(error){
        if(error){
          res.status(500).send(error);
        }
        db.get('SELECT * FROM Employee WHERE id = $id',
          {
  	          $id: this.lastID
		      },
          (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(201).send({ employee: row });
        });
      }
  );
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  db.get('SELECT * FROM Employee WHERE id = $id',
    {
  	   $id: req.employeeId
		},
    (error, row) => {
      if(error){
        res.status(500).send(error);
      }
      if(row){
        res.status(200).send({ employee: row });
      }else{
        res.status(404).send();
      }
    }
  );
});

employeesRouter.put('/:employeeId', validateEmployeeId, validateEmployeeInput, (req, res, next) => {
  const updatedEmployee = req.body.employee;
  db.run('UPDATE Employee SET name=$name, position=$position, wage=$wage WHERE id = $id',
    {
		    $id: req.employeeId,
        $name: updatedEmployee.name,
        $position: updatedEmployee.position,
        $wage: updatedEmployee.wage
    },
    function(error){
      if(error){
        res.status(500).send(error);
      }
      db.get('SELECT * FROM Employee WHERE id = $id',
        {
          $id: req.employeeId
        },
        (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(200).send({ employee: row });
        }
      );
    }
  );
});

employeesRouter.delete('/:employeeId', validateEmployeeId, (req, res, next) => {
  db.run('UPDATE Employee SET is_current_employee=0 WHERE id = $id', {
      $id: req.employeeId,
      },
      function(error){
        if(error){
          res.status(500).send(error);
        }
      }
  );
  db.get('SELECT * FROM Employee WHERE id = $id', {
      $id: req.employeeId
      }, (error, row) => {
        if(error){
          res.status(500).send(error);
        }
        res.status(200).send({ employee: row });
  });
});

employeesRouter.get('/:employeeId/timesheets', validateEmployeeId, (req, res, next) => {
  db.all("SELECT * FROM Timesheet WHERE employee_id=$employee_id",
    {
      $employee_id: req.employeeId
    },
    (error, rows) => {
      res.send( {timesheets: rows} );
    }
  );
});

employeesRouter.post('/:employeeId/timesheets', validateEmployeeId, validateTimesheetInput, (req, res, next) => {
  const newTimesheet = req.body.timesheet;
  db.run('INSERT INTO Timesheet (hours, rate, date, employee_id) VALUES ($hours, $rate, $date, $employee_id)',
      {
        $hours: newTimesheet.hours,
        $rate: newTimesheet.rate,
        $date: newTimesheet.date,
        $employee_id: req.employeeId
      },
      function(error){
        if(error){
          res.status(500).send(error);
        }
        db.get('SELECT * FROM Timesheet WHERE id = $id',
          {
  	          $id: this.lastID
		      },
          (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(201).send({ timesheet: row });
        });
      }
  );
});

employeesRouter.put('/:employeeId/timesheets/:timesheetId', validateEmployeeId, validateTimesheetId, validateTimesheetInput, (req, res, next) => {
  const updatedTimesheet = req.body.timesheet;
  db.run('UPDATE Timesheet SET hours=$hours, rate=$rate, date=$date, employee_id=$employee_id WHERE id = $id',
    {
		    $id: req.timesheetId,
        $hours: updatedTimesheet.hours,
        $rate: updatedTimesheet.rate,
        $date: updatedTimesheet.date,
        $employee_id: req.employeeId
    },
    function(error){
      if(error){
        res.status(500).send(error);
      }
      db.get('SELECT * FROM Timesheet WHERE id = $id',
        {
          $id: req.timesheetId
        },
        (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(200).send({ timesheet: row });
        }
      );
    }
  );
});

employeesRouter.delete('/:employeeId/timesheets/:timesheetId', validateEmployeeId, validateTimesheetId, (req, res, next) => {
  db.run('DELETE FROM Timesheet WHERE id = $id',
    {
      $id: req.timesheetId,
    },
    function(error){
      if(error){
        res.status(500).send(error);
      }else{
        res.status(204).send();
      }
    }
  );
});

module.exports = employeesRouter;
