const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
require("dotenv").config();
const fs = require("fs");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const User = require("./models/User");
const Post = require("./models/Post");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const cookieParser = require("cookie-parser");
// app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://127.0.0.1:5173" }));
const port = 4000;
const photosMiddleware = multer({ dest: "/tmp" });
const bucket = process.env.AWS_BUCKET;
const salt = bcrypt.genSaltSync(10);
app.get("/api/test", (req, res) => {
  res.send("Hello World!");
});

const uploadToS3 = async (path, originalFilename, mimetype) => {
  const client = new S3Client({
    region: "eu-north-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalFilename.split(".");
  const ext = parts[parts.length - 1];
  const newFileName = Date.now() + "." + ext;
  const data = await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Body: fs.readFileSync(path),
      Key: newFileName,
      ContentType: mimetype,
      ACL: "public-read",
    })
  );
  return `https://${bucket}.s3.amazonaws.com/${newFileName}`;
};

const deleteFromS3 = async (url) => {
  const client = new S3Client({
    region: "eu-north-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: url,
  });

  try {
    const response = await client.send(command);
  } catch (err) {
    console.error(err);
  }
};

app.post("/api/register", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { username, password } = req.body;
  const isUsernamePresent = await User.findOne({ username });
  if (isUsernamePresent) return res.json("Username Already Present");
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

app.post("/api/login", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  if (!userDoc) {
    return res.json("User not present");
  }
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    //password correct
    jwt.sign(
      { username, id: userDoc._id },
      process.env.SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
          id: userDoc._id,
          username,
        });
      }
    );
  } else {
    res.json("wrong credentials");
  }
});

app.get("/api/profile", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { token } = req.cookies;
  if (!token) return res.json("User not logged in");
  jwt.verify(token, process.env.SECRET, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post("/api/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

app.post("/api/post", photosMiddleware.single("file"), async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  // const { originalname, path, mimetype } = req?.file;
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    let url;
    // if (path) {
    //   url = await uploadToS3(path, originalname, mimetype);
    // }
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: url,
      author: info.id,
    });
    res.json(postDoc);
  });
});

app.get("/api/post", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  res.json(
    await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20)
  );
});

app.get("/api/post/:id", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate("author", ["username"]);
  res.json(postDoc);
});

app.delete("/api/post/:id", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { id } = req.params;
  const data = await Post.findByIdAndDelete(id);
  if (data?.cover) {
    const urlKey = data.cover.split(".com/")[1];
    await deleteFromS3(urlKey);
  }
  res.json({ data });
});

app.post("/api/post/photo", photosMiddleware.single("file"), async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { originalname, path, mimetype } = req?.file;
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) throw err;
    const url = await uploadToS3(path, originalname, mimetype);
    const postDoc = await Post.create({
      cover: url,
      author: info.id,
    });
    res.json(postDoc);
  });
});

app.put("/api/post/photo", photosMiddleware.single("file"), async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { originalname, path, mimetype } = req?.file;
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) throw err;
    const { id } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json("you are not the author");
    }
    if (postDoc?.cover) {
      const urlKey = postDoc.cover.split(".com/")[1];
      await deleteFromS3(urlKey);
    }
    const url = await uploadToS3(path, originalname, mimetype);
    await postDoc.updateOne({
      cover: url,
    });
    res.json(url);
  });
});
app.put("/api/delete/cover", async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { id, cover } = req.body;
  if (cover) {
    const urlKey = cover.split(".com/")[1];
    await deleteFromS3(urlKey);
  }
  const postDoc = await Post.findById(id);
  if (postDoc) {
    await postDoc.updateOne({
      cover: "",
    });
  }
  res.json({ postDoc });
});

app.put("/api/post", photosMiddleware.single("file"), async (req, res) => {
  await mongoose.connect(process.env.MONGO_URI);
  const { token } = req.cookies;
  jwt.verify(token, process.env.SECRET, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json("you are not the author");
    }
    await postDoc.updateOne({
      title,
      summary,
      content,
    });
    res.json(postDoc);
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
