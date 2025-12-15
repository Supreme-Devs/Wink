const jwt = require("jsonwebtoken");
const JWT_SECRET = "your_jwt_secret";

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id: user._id }
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

module.exports = auth;
