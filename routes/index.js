const express = require("express");
const axios = require("axios");
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

// Welcome Page
router.get("/", forwardAuthenticated, (req, res) => res.render("welcome"));

// Dashboard
router.get("/dashboard", ensureAuthenticated, (req, res) =>
  res.render("dashboard", {
    name: req.user.name,
    _id: req.user._id,
  })
);
//registered users
router.get("/users", (req, res) => {
  //get users available
  axios
    .get("http://127.0.0.1:5000/users/user")
    .then((response) => {
      console.log(response);
      res.render("user", {
        users: response.data,
      });
    })
    .catch((err) => {
      res.send(err.message);
    });
});

//update  user
router.get("/users/edit/", ensureAuthenticated, (req, res) => {
  axios.get("http://127.0.0.1:5000/users/user/");
  res.render("edit", {
    name: req.user.name,
    email: req.user.email,
    _id: req.user._id,
    password: req.user.password,
  });
});

module.exports = router;
