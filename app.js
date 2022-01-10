const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// get  users

app.get("/users/", async (req, res) => {
  const query = `select * from user;`;
  const dbres = await db.all(query);
  res.send(dbres);
});

///1..register APi

app.post("/register/", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const encrPassword = await bcrypt.hash(password, 10);
  const dbUserQuery = `select * from user where username='${username}'`;
  const dbUser = await db.get(dbUserQuery);
  if (dbUser == undefined) {
    if (password.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const addUserQuery = `insert into 
      user(username, name, password, gender, location) values(
          '${username}', 
          '${name}',
          '${encrPassword}', 
          '${gender}',
          '${location}'
      )`;
      const dbRes = await db.run(addUserQuery);
      const newUserId = dbRes.lastID;
      res.send("User created successfully");
    }
  } else {
    res.status(400);
    res.send("User already exists");
  }
});

//2.......login api

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const dbUserQuery = `select * from user where username='${username}'`;
  const dbRes = await db.get(dbUserQuery);
  if (dbRes == undefined) {
    res.status(400);
    res.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, dbRes.password);
    if (checkPassword) {
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

//api...3....

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const getUserQuery = `select * from user where username="${username}"`;
  const getUser = await db.get(getUserQuery);
  const comparePass = await bcrypt.compare(oldPassword, getUser.password);

  if (comparePass == false) {
    res.status(400);
    res.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      res.status(400);
      res.send("Password is too short");
    } else {
      const encrPassword = await bcrypt.hash(newPassword, 10);
      const changepass = `update user set password='${encrPassword}' where username="${username}";`;
    }
  }
  res.send("Password updated");
});

module.exports = app;
