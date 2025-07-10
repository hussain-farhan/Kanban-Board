const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const PORT = 5000;
const tasksFile = "tasks.json";
const columnsFile = "columns.json";
const archivedTasksFile = "archived_tasks.json";

if (!fs.existsSync(tasksFile)) {
  fs.writeFileSync(tasksFile, "{}");
}

if (!fs.existsSync(columnsFile)) {
  const defaultColumns = {
    todo: { id: "todo", title: "To Do", taskIds: [] },
    inprogress: { id: "inprogress", title: "In Progress", taskIds: [] },
    done: { id: "done", title: "Done", taskIds: [] },
  };
  fs.writeFileSync(columnsFile, JSON.stringify(defaultColumns, null, 2));
}

app.use(cors());
app.use(bodyParser.json());


const readTasks = () => {
  try {
    const data = fs.readFileSync(tasksFile);
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const readColumns = () => {
  try {
    const data = fs.readFileSync(columnsFile);
    return JSON.parse(data);
  } catch (error) {
    return {
      todo: { id: "todo", title: "To Do", taskIds: [] },
      inprogress: { id: "inprogress", title: "In Progress", taskIds: [] },
      done: { id: "done", title: "Done", taskIds: [] },
    };
  }
};

const readArchivedTasks = () => {
  try {
    const data = fs.readFileSync(archivedTasksFile);
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};

const writeTasks = (tasks) => {
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}
const writeColumns = (columns) => {
     fs.writeFileSync(columnsFile, JSON.stringify(columns, null, 2));
}

const writeArchivedTasks = (tasks) => {
    fs.writeFileSync(archivedTasksFile, JSON.stringify(tasks, null, 2));
}
const isValidTask = (task) => {
  return (
    task &&
    typeof task === "object" &&
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    typeof task.priority === "string" &&
    ["low", "medium", "high"].includes(task.priority.toLowerCase()) &&
    typeof task.status === "string" &&
    (task.dueDate === null || task.dueDate === undefined || typeof task.dueDate === "string")
  );
};

app.get("/tasks", (req, res) => {
  try {
    const tasks = readTasks();
    const columns = readColumns();
    
    Object.keys(columns).forEach(columnId => {
      columns[columnId].taskIds = [];
    });
    
    Object.values(tasks).forEach(task => {
      if (isValidTask(task)) {
        const columnId = task.status || "todo";
        if (columns[columnId]) {
          columns[columnId].taskIds.push(task.id);
        }
      }
    });

    res.json({ tasks, columns });
  } catch (err) {
    res.status(500).json({ message: "Failed to read tasks or columns", error: err.message });
  }
});

app.get("/archived-tasks", (req, res) => {
  try {
    const archivedTasks = readArchivedTasks();
    res.json({ archivedTasks });
  } catch (err) {
    res.status(500).json({ message: "Failed to read archived tasks", error: err.message });
  }
});

app.post("/update", (req, res) => {
  try {
    let { tasks, columns } = req.body;

    if (!tasks || !columns) {
      return res.status(400).json({ message: "Missing tasks or columns" });
    }

    const validTasks = {};
    for (const id in tasks) {
      if (isValidTask(tasks[id])) {
        validTasks[id] = tasks[id];
      }
    }

    writeTasks(validTasks);
    writeColumns(columns);

    res.status(200).json({ message: "Board updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update board", error: err.message });
  }
});

// POST a new task
app.post("/tasks", (req, res) => {
  const newTask = req.body;

  if (!isValidTask(newTask)) {
    return res.status(400).json({ message: "Invalid task format" });
  }

  try {
    const tasks = readTasks();
    tasks[newTask.id] = newTask; // Store as object, not array
    writeTasks(tasks);

    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task", error: err.message });
  }
});


// PUT update a task
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const updatedTask = req.body;

  if (!isValidTask(updatedTask)) {
    return res.status(400).json({ message: "Invalid task format" });
  }

  try {
    const tasks = readTasks();
    
    if (!tasks[id]) {
      return res.status(404).json({ message: "Task not found" });
    }

    tasks[id] = updatedTask;
    writeTasks(tasks);

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Failed to update task", error: err.message });
  }
});


//Archieve a Task
app.post("/tasks/:id/archive", (req, res) => {
  const { id } = req.params;

  try {
    const tasks = readTasks();
    const columns = readColumns();
    const archivedTasks = readArchivedTasks();

    if (!tasks[id]) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Move task to archived tasks
    const taskToArchive = {
      ...tasks[id],
      archivedAt: new Date().toISOString()
    };
    archivedTasks[id] = taskToArchive;

    // Remove from active tasks
    delete tasks[id];

    // Remove from columns
    Object.keys(columns).forEach(columnId => {
      columns[columnId].taskIds = columns[columnId].taskIds.filter(taskId => taskId !== id);
    });

    writeTasks(tasks);
    writeColumns(columns);
    writeArchivedTasks(archivedTasks);

    res.json({ message: "Task archived successfully", archivedTask: taskToArchive });
  } catch (err) {
    res.status(500).json({ message: "Failed to archive task", error: err.message });
  }
});

// POST restore a task from archive
app.post("/tasks/:id/restore", (req, res) => {
  const { id } = req.params;

  try {
    const tasks = readTasks();
    const columns = readColumns();
    const archivedTasks = readArchivedTasks();

    if (!archivedTasks[id]) {
      return res.status(404).json({ message: "Archived task not found" });
    }

    // Remove archived metadata and restore task
    const taskToRestore = { ...archivedTasks[id] };
    delete taskToRestore.archivedAt;

    // Add back to active tasks
    tasks[id] = taskToRestore;

    // Add to appropriate column
    const columnId = taskToRestore.status || "todo";
    if (columns[columnId]) {
      columns[columnId].taskIds.push(id);
    }

    // Remove from archived tasks
    delete archivedTasks[id];

    writeTasks(tasks);
    writeColumns(columns);
    writeArchivedTasks(archivedTasks);

    res.json({ message: "Task restored successfully", restoredTask: taskToRestore });
  } catch (err) {
    res.status(500).json({ message: "Failed to restore task", error: err.message });
  }
});
// DELETE a task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  try {
    const tasks = readTasks();
    const columns = readColumns();

    if (!tasks[id]) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Remove task from tasks
    delete tasks[id];

    // Remove task from columns
    Object.keys(columns).forEach(columnId => {
      columns[columnId].taskIds = columns[columnId].taskIds.filter(taskId => taskId !== id);
    });

    writeTasks(tasks);
    writeColumns(columns);

    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task", error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on ${PORT}`);
});