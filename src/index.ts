import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";

import mongoose from "mongoose";

import { validateUser, validateTodo, userSchema, connectDB } from "./utils";

export const USERS = mongoose.model("User");

const app = new Hono();
app.use("/*", cors());

app.onError((err, c) => {
  console.error(`${err}`);
  return c.text("Server Down", 500);
});

let datasendConnectCount = 0;
app.get("/", async (c) => {
  const ENV = env<{ MONGODB_DATABASE_URL: string }>(c);
  console.log("db url:", ENV.MONGODB_DATABASE_URL);
  if (datasendConnectCount == 0) {
    try {
      await connectDB(ENV.MONGODB_DATABASE_URL);
      console.log("Connected to MongoDB");
    } catch (error: any) {
      console.log("Error in connecting to DB", error.message);
    }
    datasendConnectCount++;
  }
  return c.html(`<h1>Kaushik ka TodoApp Server</h1>`);
});

// REST API Endpoints
// for User
// SingUp : New User
app.post("/signup", async (c) => {
  try {
    const { username, password } = userSchema.parse(await c.req.parseBody());
    const query = await USERS.find({ username, password }).exec();
    if (query.length === 0) {
      const newUser = new USERS({
        username,
        password,
        todos: [],
      });
      await newUser.save();
      return c.status(201), c.json(newUser);
    } else {
      return c.status(400), c.text("User already exists");
    }
  } catch (error) {
    console.log(error);
    return c.status(500), c.text("Internal Server Error While Adding User");
  }
});

// Login : Existing User
app.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.parseBody();
    if (username && password) {
      const query = await USERS.find({ username, password }).exec();
      if (query) {
        datasendCount++;
        console.log(`Data send count: ${datasendCount}`);
        return c.status(200), c.json(query[0]);
      } else {
        return (
          c.status(400),
          c.text("Invalid username or password: Not found user in DataBase")
        );
      }
    }
  } catch (error) {
    return c.status(400), c.text("Invalid username or password Input");
  }
});

// for Todo
// GET todos
let datasendCount = 0;
app.get("/todos", validateUser, async (c) => {
  try {
    const { username, password } = await c.req.parseBody();
    const user = await USERS.find({ username, password }).exec();
    const todosArr = user[0].todos;
    datasendCount++;
    console.log(`Data send count: ${datasendCount}`);
    return c.status(200), c.json(todosArr);
  } catch (error) {
    console.log(error);
    return c.status(500), c.text("Internal Server Error While Fetching Todos");
  }
});

// POST todos
app.post("/addTodo", validateUser, validateTodo, async (c) => {
  try {
    const { username, password } = await c.req.parseBody();
    const user = await USERS.find({ username, password }).exec();
    const todosArr = user[0].todos;
    const newTodo = {
      ...(await c.req.parseBody()),
    };
    todosArr.push(newTodo);
    await user[0].save();
    console.log("Todo Added Successfully");
    return c.status(201), c.json(todosArr);
  } catch (error) {
    console.log(error);
    return c.status(500), c.text("Internal Server Error While Adding Todo");
  }
});

// DELETE todos
app.delete("/todos/:id", validateUser, async (c) => {
  try {
    const body = await c.req.parseBody({ all: true });
    const [username, password] = [...(body["hoge"] as string[])];
    const user = await USERS.find({ username, password }).exec();
    if (user[0].todos) {
      // Todo deleted successfully
      user[0].todos = user[0].todos.filter(
        (todo: any) => todo._id.toString() !== c.req.param("id")
      );
      await user[0].save();
      return c.status(200), c.json(user[0].todos);
    } else {
      // User not found or todo not found
      return c.status(404), c.text("Todo not found");
    }
  } catch (error) {
    console.log(error);
    return c.status(500), c.text("Internal Server Error While Deleting Todo");
  }
});

export default app;
