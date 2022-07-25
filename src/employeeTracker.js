const inquirer = require('inquirer');
const db = require('../config/connection');
const cTable = require('console.table');

const employeeTracker = () => {
  inquirer
    .prompt({
      name: 'startMenu',
      type: 'list',
      message: 'Welcome to the Employee Tracker! What would you like to do?',
      choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'Add Department',
        'Add Role',
        'Add Employee',
        'Update Employee Role',
        'Update Employee Manager',
        'Exit'
      ]
    })
    .then(res => {
      switch (res.startMenu) {
        case 'View All Departments':
          viewAllDepartments();
          break;
        case 'View All Roles':
          viewAllRoles();
          break;
        case 'View All Employees':
          viewAllEmployees();
          break;
        case 'Add Department':
          addDepartment();
          break;
        case 'Add Role':
          addRole();
          break;
        case 'Add Employee':
          addEmployee();
          break;
        case 'Update Employee Role':
          updateEmployeeRole();
          break;
        case 'Update Employee Manager':
          updateEmployeeManager();
          break;
        case 'Exit':
          db.end();
          console.log('\nThank you for using the Employee Tracker!\n');
          break;
      }
    });
};

// Query the database for all departments
viewAllDepartments = () => {
  db.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table('\n', res, '\n');
    employeeTracker();
  });
};

// Query the database for all roles
viewAllRoles = () => {
  db.query(
    'SELECT roles.role_id, roles.title, departments.name AS department, roles.salary, departments.department_id FROM roles JOIN departments ON roles.department_id = departments.department_id;',
    (err, res) => {
      if (err) throw err;
      console.table('\n', res, '\n');
      employeeTracker();
    }
  );
};

// Query the database for all employees
viewAllEmployees = () => {
  db.query(
    `SELECT e.employee_id, e.first_name, e.last_name, roles.title, departments.name AS department, roles.salary, CONCAT(m.first_name, ' ', m.last_name) manager FROM employees m RIGHT JOIN employees e ON e.manager_id = m.employee_id JOIN roles ON e.role_id = roles.role_id JOIN departments ON departments.department_id = roles.department_id`,
    (err, res) => {
      if (err) throw err;
      console.table('\n', res, '\n');
      employeeTracker();
    }
  );
};

// Add a new department to the database
addDepartment = () => {
  inquirer
    .prompt({
      name: 'newDepartment',
      type: 'input',
      message: 'What is the name of the new department?'
    })
    .then(res => {
      db.query(
        'INSERT INTO departments SET ?',
        {
          name: res.newDepartment
        },
        (err, res) => {
          if (err) throw err;
          console.log(`\n${res.newDepartment} department added!\n`);
          employeeTracker();
        }
      );
    });
};

// Add a new role to the database
addRole = () => {
  db.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    const departments = res.map(department => ({
      name: department.name,
      value: department.id
    }));
    inquirer
      .prompt([
        {
          name: 'title',
          type: 'input',
          message: 'What is the title of the new role?'
        },
        {
          name: 'salary',
          type: 'input',
          message: 'What is the salary of the new role?'
        },
        {
          name: 'department',
          type: 'list',
          message: 'What department does the new role belong to?',
          choices: departments
        }
      ])
      .then(res => {
        db.query(
          'INSERT INTO roles SET ?',
          {
            title: res.title,
            salary: res.salary,
            department_id: res.department
          },
          (err, res) => {
            if (err) throw err;
            console.log(`\n${res.title} role added!\n`);
            employeeTracker();
          }
        );
      });
  });
};

// Add a new employee to the database
addEmployee = () => {
  db.query('SELECT * FROM roles', (err, res) => {
    if (err) throw err;
    const roles = res.map(role => ({
      name: role.title,
      value: role.id
    }));
    db.query('SELECT * FROM employees', (err, res) => {
      if (err) throw err;
      const employees = res.map(employee => ({
        name: employee.first_name + ' ' + employee.last_name,
        value: employee.id
      }));
      inquirer
        .prompt([
          {
            name: 'firstName',
            type: 'input',
            message: 'What is the first name of the new employee?'
          },
          {
            name: 'lastName',
            type: 'input',
            message: 'What is the last name of the new employee?'
          },
          {
            name: 'role',
            type: 'list',
            message: 'What role does the new employee have?',
            choices: roles
          },
          {
            name: 'manager',
            type: 'list',
            message: "Who is the new employee's manager?",
            choices: [...employees, { name: 'None', value: null }]
          }
        ])
        .then(res => {
          db.query(
            'INSERT INTO employees SET ?',
            {
              first_name: res.firstName,
              last_name: res.lastName,
              role_id: res.role,
              manager_id: res.manager
            },
            (err, response) => {
              if (err) throw err;
              console.log(
                `\n${res.firstName} ${res.lastName} successfully added!\n`
              );
              employeeTracker();
            }
          );
        });
    });
  });
};

// Update an employee's role
updateEmployeeRole = () => {
  db.query('SELECT * FROM roles', (err, res) => {
    if (err) throw err;
    const roles = res.map(role => ({
      name: role.title,
      value: role.id
    }));
    db.query('SELECT * FROM employees', (err, res) => {
      if (err) throw err;
      const employees = res.map(employee => ({
        name: employee.first_name + ' ' + employee.last_name,
        value: employee.id
      }));
      inquirer
        .prompt([
          {
            name: 'employee',
            type: 'list',
            message: 'Which employee would you like to update?',
            choices: employees
          },
          {
            name: 'newRole',
            type: 'list',
            message: 'What is the new role of the employee?',
            choices: roles
          }
        ])
        .then(res => {
          db.query(
            'UPDATE employees SET ? WHERE ?',
            [
              {
                role_id: res.newRole
              },
              {
                id: res.employee
              }
            ],
            (err, response) => {
              if (err) throw err;
              console.log(`\n${res.employee} role updated!\n`);
              employeeTracker();
            }
          );
        });
    });
  });
};

updateEmployeeManager = () => {
  db.query('SELECT * FROM employees;', (err, res) => {
    if (err) throw err;
    const employees = res.map(employee => ({
      name: employee.first_name + ' ' + employee.last_name,
      value: employee.id
    }));
    inquirer
      .prompt([
        {
          name: 'employee',
          type: 'list',
          message: 'Which employee would you like to update?',
          choices: employees
        },
        {
          name: 'newManager',
          type: 'list',
          message: 'Who is the new manager of the employee?',
          choices: [...employees, { name: 'None', value: null }]
        }
      ])
      .then(res => {
        db.query(
          'UPDATE employees SET ? WHERE ?',
          [
            {
              manager_id: res.newManager
            },
            {
              id: res.employee
            }
          ],
          (err, response) => {
            if (err) throw err;
            console.log(`\n${res.employee}'s manager updated!\n`);
            employeeTracker();
          }
        );
      });
  });
};

module.exports = employeeTracker;
