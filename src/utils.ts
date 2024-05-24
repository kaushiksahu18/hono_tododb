import { z } from "zod";
import mongoose from "mongoose";

import { USERS } from "./index.js";

async function connectDB(url: string) {
  await mongoose.connect(String(url));
}

// zod schema for verification
const todoSchema = z.object({
  title: z.string(),
  description: z.string(),
});
const userSchema = z.object({
  username: z.string(),
  password: z.string().min(3),
});

// Convert Zod schemas to Mongoose schemas
const UserModel = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    password: String,
    todos: [
      {
        title: String,
        description: String,
      },
    ],
  }),
  "todoapp"
);

// middlewares for validation of username and password
const validateUser = async (c: any, next: any) => {
  try {
    const { username, password } = c.req.header();
    if (username && password) {
      const user = await USERS.find({ username, password }).exec();
      if (user) {
        console.log("user found in DB");
        c.req.header("username", username);
        c.req.header("password", password);
        next();
      } else {
        c.status(400);
        c.text("Invalid username or password: Not found user in DataBase");
      }
    } else {
      c.status(400);
      c.text("Invalid username or password Input");
    }
  } catch (error) {
    c.status(400);
    c.text("Invalid username or password Input");
    console.log(error);
  }
};

// middlewares for validation of todo
const validateTodo = async (c: any, next: any) => {
  try {
    const { title, description } = todoSchema.parse(await c.req.parseBody());
    if (title && description) {
      next();
    } else {
      c.status(400);
      c.text("Invalid todo Input");
    }
  } catch (error) {
    c.status(400);
    c.text("Invalid todo Input");
    console.log(error);
  }
};

export { UserModel, validateUser, validateTodo, userSchema, connectDB };
