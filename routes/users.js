const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
// Load User model
const User = require("../models/User");
const multer = require("multer");
const { forwardAuthenticated } = require("../config/auth");]


//define storage for the images

const storage = multer.diskStorage({
  //destination for files
  destination: function (request, file, callback) {
    callback(null, "./public/uploads/images");
  },

  //add back the extension
  filename: function (request, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});

//upload parameters for multer
const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 1024 * 1024 * 3,
  },
});

// Login Page
router.get("/login", forwardAuthenticated, (req, res) => res.render("login"));

// Register Page
router.get("/register", (req, res) => res.render("register"));

// Register
router.post("/register", (req, res) => {
  const { name, email, password, password2 } = req.body;
  const image = req.file.filename;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password != password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        //user exists
        errors.push({ msg: "Email already exists" });
        res.render("register", {
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
        });

        //hash password
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            //set password to hashed
            newUser.password = hash;
            //save user to db
            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "You are now registered and can log in"
                );
                res.redirect("/users/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});
// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

//get alluser and single user
router.get("/user", (req, res) => {
  //single user
  if (req.query.id) {
    const id = req.query.id;
    User.findById(id)
      .then((user) => {
        if (!user) {
          res.status(406).send(`no user found with ID ${id}`);
        } else {
          res.send(user);
        }
      })
      .catch((err) => res.send(err.message));
  } else {
    //all user
    User.find()
      .then((user) => res.send(user))
      .catch((err) => res.send(err.message));
  }
});

//update user
router.put("/user/:id", (req, res) => {
  if (!req.body) {
    return res.status(400).send({ message: "Data to update can not be empty" });
  }

  const id = req.params.id;
  User.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
    .then((user) => {
      if (!user) {
        res.status(404).send({
          message: `Cannot Update user with  ID ${id}. Maybe user not found!`,
        });
      } else {
        return res.redirect("/dashboard");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error Update user information" });
    });
});

//delete user
router.delete("/user/:id", (req, res) => {
  const id = req.params.id;
  User.findByIdAndDelete(id)
    .then((user) => {
      if (!user) {
        res.status(405).send({
          message: `cannot delete user with ID ${id}, User not found!!!`,
        });
      } else {
        return res.redirect("/users/login");
      }
    })
    .catch((err) => res.send(err.message));
});

module.exports = router;
