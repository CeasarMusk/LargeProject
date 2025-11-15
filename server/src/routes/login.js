// src/routes/login.js
const express = require('express');
const bcrypt  = require('bcrypt');
const router  = express.Router();
const { col } = require('../lib/mongo');

function errPayload(msg) {
  return { id: "0", firstName: "", lastName: "", error: msg };
}
function okPayload(u) {
  return { id: u._id.toString(), firstName: String(u.firstName ?? ""), lastName: String(u.lastName ?? ""), error: "" };
}

router.post('/', async (req, res) => {
  try {
    const { login = "", password = "" } = req.body || {};
    const email = String(login).toLowerCase().trim();
    const pass  = String(password);

    if (!email || !pass) {
      return res.json(errPayload('Missing login or password'));
    }

    const Users = await col('Users');
    const user = await Users.findOne(
      { login: email },
      { projection: { firstName: 1, lastName: 1, passwordHash: 1, isVerified: 1 } }
    );

    if (!user || !user.passwordHash || !(await bcrypt.compare(pass, String(user.passwordHash)))) {
      return res.json(errPayload('No Records Found'));
    }

    if (user.isVerified !== true) {
      return res.json({
        id: "0",
        firstName: "",
        lastName: "",
        error: "Email not verified",
        needVerification: true
      });
    }

    return res.json(okPayload(user));
  } catch (e) {
    return res.json(errPayload('Query failed: ' + e.message));
  }
});

module.exports = router;



  
