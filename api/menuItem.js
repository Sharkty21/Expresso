const express = require('express');
const menuItemRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
    const sql = 'SELECT * FROM MenuItem WHERE MenuItem.id = $menuItemId';
    const values = { $menuItemId: menuItemId };
    db.get(sql, values, (error, menuItem) => {
        if (error) {
            next(error);
        } else if (menuItem) {
            next();
        } else {
            res.sendStatus(404);
        }
    });
});

menuItemRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId', {
        $menuId: req.params.menuId
    },
        (err, menuItems) => {
            if (err) {
                next(err);
            } else {
                res.status(200).json({menuItems: menuItems});
            };
        });
});

menuItemRouter.post('/', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;

    db.get('SELECT * FROM Menu WHERE Menu.id = $menuId', 
    {
        $menuId: menuId
    }, (err, menu) => {
        if (err) {
            next(err);
        } else {
            if (!name || !description || !inventory || !price || !menu) {
                return res.sendStatus(400);
            }
            db.run('INSERT INTO MenuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menuId)', {
                $name: name,
                $description: description,
                $inventory: inventory,
                $price: price,
                $menuId: menuId
            }, function(err) {
                if (err) {
                    next(err);
                } else {
                    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`, (err, menuItem) => {
                        res.status(201).json({menuItem: menuItem});
                    });    
                }
            });
        }
    }
    );
});

menuItemRouter.put('/:menuItemId', (req, res, next) => {
    const name = req.body.menuItem.name;
    const description = req.body.menuItem.description;
    const inventory = req.body.menuItem.inventory;
    const price = req.body.menuItem.price;
    const menuId = req.params.menuId;

    db.get('SELECT * FROM Menu WHERE Menu.id = $menuId', 
    {
        $menuId: menuId
    }, (err, menu) => {
        if (err) {
            next(err);
        } else {
            if (!name || !description || !inventory || !price || !menu) {
                return res.sendStatus(400);
            }
            db.run('UPDATE MenuItem SET name = $name, description = $description, inventory = $inventory, price = $price, menu_id = $menuId WHERE MenuItem.id = $menuItemId', {
                $name: name,
                $description: description,
                $inventory: inventory,
                $price: price,
                $menuId: menuId,
                $menuItemId: req.params.menuItemId
            }, function(err) {
                if (err) {
                    next(err);
                } else {
                    db.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`, (err, menuItem) => {
                        res.status(200).json({menuItem: menuItem});
                    });    
                }
            });
        }
    }
    );
});

menuItemRouter.delete('/:menuItemId', (req, res, next) => {
    const sql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
    const values = {$menuItemId: req.params.menuItemId};
  
    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        res.sendStatus(204);
      }
    });
  });


module.exports = menuItemRouter;