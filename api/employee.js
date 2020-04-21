const express = require('express');
const employeeRouter = express.Router();
const timesheetRouter = require('./timesheet.js')
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

employeeRouter.param('employeeId', (req, res, next, employeeId) => {
    const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
    const values = {$employeeId: employeeId};
    db.get(sql, values, (err,employee) => {
        if (err) {
            next(err);
        } else if (employee) {
            req.employee = employee;
            next();
        } else {
            res.sendStatus(404);
        }
    })
});

employeeRouter.use('/:employeeId/timesheets', timesheetRouter);

employeeRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
    (err, employees) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({employees: employees});
        };
    });
});

employeeRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).send({ employee: req.employee });
});

employeeRouter.post('/', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

    if ( !name || !position || !wage ) {
        return res.sendStatus(400);
     };

     db.run('INSERT INTO Employee (name, position, wage, is_current_employee) VALUES ($name, $position, $wage, $isCurrentEmployee)', 
    {
        $name: name,
        $position: position,
        $wage: wage,
        $isCurrentEmployee: isCurrentEmployee
    }, function(err) {
        if (err) {
            next(err);
        } else {
            db.get('SELECT * FROM Employee WHERE Employee.id = $lastID',
            {
                $lastID: this.lastID
            }, (err, employee) => {
                res.status(201).json({employee: employee});
            })
        }
    });
});

employeeRouter.put('/:employeeId', (req, res, next) => {
    const name = req.body.employee.name;
    const position = req.body.employee.position;
    const wage = req.body.employee.wage;
    const isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;

    if ( !name || !position || !wage ) {
        return res.sendStatus(400);
     };

    db.run('UPDATE Employee SET name = $name, position = $position, wage = $wage, is_current_employee = $isCurrentEmployee WHERE Employee.id = $employeeId', {
        $name: name,
        $position: position,
        $wage: wage,
        $isCurrentEmployee: isCurrentEmployee,
        $employeeId: req.params.employeeId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
            (err, employee) => {
                res.status(200).json({employee: employee});
            });
        }
    });
});

employeeRouter.delete('/:employeeId', (req, res, next) => {
    db.run('UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId', {
        $employeeId: req.params.employeeId
    }, function(error) {
        if (error) {
            next(error);
        } else {
            db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
            (err, employee) => {
                res.status(200).json({employee: employee});
            });
        }
    });

});


module.exports = employeeRouter;