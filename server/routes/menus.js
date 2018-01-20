const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const validateMenuId = (req, res, next) => {
  db.get('SELECT * FROM Menu WHERE id = $id', {
      $id: req.menuId
      }, (error, row) => {
        if(row){
          next();
        }else{
          res.status(404).send();
        }

    });
};

const validateMenuItemId = (req, res, next) => {
  db.get('SELECT * FROM MenuItem WHERE id = $id', {
      $id: req.menuItemId
      }, (error, row) => {
        if(row){
          next();
        }else{
          res.status(404).send();
        }

    });
};

const validateMenuInput = (req, res, next) => {
  if(req.body.menu.hasOwnProperty('title')){
    next();
  }else{
    res.status(400).send("Missing Fields");
  }
};

const validateMenuItemInput = (req, res, next) => {
  if(req.body.menuItem.hasOwnProperty('name') && req.body.menuItem.hasOwnProperty('description') && req.body.menuItem.hasOwnProperty('inventory') && req.body.menuItem.hasOwnProperty('price')){
    next();
  }else{
    res.status(400).send("Missing Fields");
  }
};

const validateLinkedMenuItems = (req, res, next) => {
  db.get('SELECT * FROM MenuItem WHERE menu_id = $menu_id LIMIT 1',
    {
      $menu_id: req.menuId
    },
    (error, row) => {
      if(error){
        res.status(500).send(error);
      }
      if(!row){
        next();
      }else{
        res.status(400).send();
      }
    }
  );
};

menusRouter.param('menuId', (req, res, next, id) => {
  const menuId = Number(id);
  if(menuId){
    req.menuId = menuId + '';
    next();
  }else{
    res.status(404).send('Invalid number');
  }
});

menusRouter.param('menuItemId', (req, res, next, id) => {
  const menuItemId = Number(id);
  if(menuItemId){
    req.menuItemId = menuItemId + '';
    next();
  }else{
    res.status(404).send('Invalid number');
  }
});

menusRouter.get('', (req, res, next) => {
  db.all("SELECT * FROM Menu", (error, rows) => {
    res.send( {menus: rows} );
  });
});

menusRouter.post('', validateMenuInput, (req, res, next) => {
  db.run('INSERT INTO Menu (title) VALUES ($title)',
      {
        $title: req.body.menu.title
      },
      function(error){
        if(error){
          res.status(500).send(error);
        }
        db.get('SELECT * FROM Menu WHERE id = $id',
          {
  	          $id: this.lastID
		      },
          (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(201).send({ menu: row });
          }
        );
      }
  );
});

menusRouter.get('/:menuId', (req, res, next) => {
  db.get('SELECT * FROM Menu WHERE id = $id',
    {
      $id: req.menuId
		},
    (error, row) => {
      if(error){
        res.status(500).send(error);
      }
      if(row){
        res.status(200).send({ menu: row });
      }else{
        res.status(404).send();
      }
    }
  );
});

menusRouter.put('/:menuId', validateMenuId, validateMenuInput, (req, res, next) => {
  db.run('UPDATE Menu SET title=$title WHERE id = $id',
    {
		    $id: req.menuId,
        $title: req.body.menu.title
    },
    function(error){
      if(error){
        res.status(500).send(error);
      }
      db.get('SELECT * FROM Menu WHERE id = $id',
        {
          $id: req.menuId
        },
        (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(200).send({ menu: row });
        }
      );
    }
  );
});

menusRouter.delete('/:menuId', validateMenuId, validateLinkedMenuItems, (req, res, next) => {
  db.run('DELETE FROM Menu WHERE id = $id',
    {
      $id: req.menuId,
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

menusRouter.get('/:menuId/menu-items', validateMenuId, (req, res, next) => {
  db.all("SELECT * FROM MenuItem WHERE menu_id=$menu_id",
    {
      $menu_id: req.menuId
    },
    (error, rows) => {
      res.send( {menuItems: rows} );
    }
  );
});

menusRouter.post('/:menuId/menu-items', validateMenuId, validateMenuItemInput, (req, res, next) => {
  const newMenuItem = req.body.menuItem;
  db.run('INSERT INTO menuItem (name, description, inventory, price, menu_id) VALUES ($name, $description, $inventory, $price, $menu_id)',
      {
        $name: newMenuItem.name,
        $description: newMenuItem.description,
        $inventory: newMenuItem.inventory,
        $price: newMenuItem.price,
        $menu_id: req.menuId
      },
      function(error){
        if(error){
          res.status(500).send(error);
        }
        db.get('SELECT * FROM MenuItem WHERE id = $id',
          {
  	          $id: this.lastID
		      },
          (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(201).send({ menuItem: row });
        });
      }
  );
});

menusRouter.put('/:menuId/menu-items/:menuItemId', validateMenuItemId, validateMenuId, validateMenuItemInput, (req, res, next) => {
  const updatedMenuItem = req.body.menuItem;
  db.run('UPDATE MenuItem SET name=$name, description=$description, inventory=$inventory, price=$price, menu_id=$menu_id WHERE id = $id',
    {
      $id: req.menuItemId,
      $name: updatedMenuItem.name,
      $description: updatedMenuItem.description,
      $inventory: updatedMenuItem.inventory,
      $price: updatedMenuItem.price,
      $menu_id: req.menuId
    },
    function(error){
      if(error){
        res.status(500).send(error);
      }
      db.get('SELECT * FROM MenuItem WHERE id = $id',
        {
          $id: req.menuItemId
        },
        (error, row) => {
            if(error){
              res.status(500).send(error);
            }
            res.status(200).send({ menuItem: row });
        }
      );
    }
  );
});

menusRouter.delete('/:menuId/menu-items/:menuItemId', validateMenuItemId, validateMenuId, (req, res, next) => {
  db.run('DELETE FROM MenuItem WHERE id = $id',
    {
      $id: req.menuItemId,
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

module.exports = menusRouter;
