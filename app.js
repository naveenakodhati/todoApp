const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const getPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const getPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const getStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  let getTodo = null;
  let getTodoQuery;
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case getPriorityAndStatus(request.query):
      getTodoQuery = `SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case getPriority(request.query):
      getTodoQuery = `SELECT * FROM 
          todo WHERE todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case getStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%' AND 
          status = '${status}';`;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }

  getTodo = await db.all(getTodoQuery);
  response.send(getTodo);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoId = `SELECT * FROM todo 
    WHERE id = ${todoId};`;
  const uniqueTodoId = await db.get(getTodoId);
  response.send(uniqueTodoId);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  const createTodo = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let UpdateValue = "";
  switch (true) {
    case requestBody.status !== undefined:
      UpdateValue = "Status";
      break;
    case requestBody.priority !== undefined:
      UpdateValue = "Priority";
      break;
    case requestBody.todo !== undefined:
      UpdateValue = "Todo";
      break;
  }
  const getPreviousQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const getStatusId = await db.get(getPreviousQuery);
  const {
    priority = getStatusId.priority,
    todo = getStatusId.todo,
    status = getStatusId.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo SET 
    priority = '${priority}',
    status = '${status}',
    todo = '${todo}'
    WHERE id = ${todoId};`;
  const updateTodoId = await db.run(updateTodoQuery);
  response.send(`${UpdateValue} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo 
    WHERE id = ${todoId};`;
  const deleteId = await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
