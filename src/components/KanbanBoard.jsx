// kanban-board.jsx
import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import {
  Container, Typography, Box, AppBar, Toolbar, Button,
  Snackbar, Alert
} from "@mui/material";
import { KanbanColumn } from "./boardColumn";
import ArchiveIcon from '@mui/icons-material/Archive';
import { AddTaskDialog as AddEditTaskDialog } from './addTask';
import { ArchivedTasksDialog } from "./archivedTask";
import axios from "axios";

const backendUrl = "http://localhost:5000";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState({});
  const [columns, setColumns] = useState({
    todo: { id: "todo", title: "To Do", taskIds: [] },
    inprogress: { id: "inprogress", title: "In Progress", taskIds: [] },
    done: { id: "done", title: "Done", taskIds: [] },
  });

  const [archivedTasks, setArchivedTasks] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState(""); // This is where the column ID is stored
  const [editingTask, setEditingTask] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchData();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${backendUrl}/tasks`);
      const fetchedTasks = res.data.tasks || {};
      const fetchedColumns = res.data.columns || columns;

      setTasks(fetchedTasks);
      setColumns(fetchedColumns);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showSnackbar("Failed to load tasks", "error");
    }
  };

  const updateBackend = async (updatedTasks, updatedColumns) => {
    try {
      await axios.post(`${backendUrl}/update`, {
        tasks: updatedTasks,
        columns: updatedColumns,
      });
    } catch (error) {
      console.error("Failed to update backend:", error);
      showSnackbar("Failed to sync with server", "error");
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;

    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];
    if (!start || !finish) {
      console.error("Invalid drag source or destination");
      return;
    }

    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      };

      const updatedColumns = {
        ...columns,
        [newColumn.id]: newColumn,
      };

      setColumns(updatedColumns);
      updateBackend(tasks, updatedColumns);
      return;
    }

    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...start, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, taskIds: finishTaskIds };

    const updatedColumns = {
      ...columns,
      [newStart.id]: newStart,
      [newFinish.id]: newFinish,
    };

    const updatedTasks = {
      ...tasks,
      [draggableId]: {
        ...tasks[draggableId],
        status: finish.id,
      },
    };

    setTasks(updatedTasks);
    setColumns(updatedColumns);
    updateBackend(updatedTasks, updatedColumns);
  };

  const handleAddTask = (columnId) => {
    setActiveColumn(columnId); // This correctly sets activeColumn
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setActiveColumn(task.status);
    setDialogOpen(true);
  };

  const handleAddTaskSubmit = async (taskData) => {
    if (!taskData.title?.trim()) return;

    try {
      if (editingTask) {
        const updatedTask = { ...editingTask, ...taskData };
        await axios.put(`${backendUrl}/tasks/${editingTask.id}`, updatedTask);

        const updatedTasks = {
          ...tasks,
          [editingTask.id]: updatedTask,
        };

        setTasks(updatedTasks);
        showSnackbar("Task updated successfully");
        // Ensure backend update for edits as well
        // You can fetch all data again or manually update columns if task status changed during edit
        // For simplicity, let's re-fetch for now, or call updateBackend if only task data changes.
        // If status changed during edit, you'd need to re-manage taskIds in columns.
        // For now, assuming status change on drag only.
        updateBackend(updatedTasks, columns); // Important: update backend after edit
      } else {
        // The taskData now contains the status thanks to the change in AddTaskDialog
        const column = columns[taskData.status]; // <--- Use taskData.status directly
        if (!column) {
          console.error("Invalid column ID on task creation:", taskData.status);
          showSnackbar("Invalid column selected", "error");
          return;
        }

        const newTaskId = `task-${Date.now()}`;
        const newTask = {
          id: newTaskId,
          ...taskData,
          status: taskData.status, // <--- Use taskData.status
        };

        const updatedTasks = {
          ...tasks,
          [newTaskId]: newTask,
        };

        const updatedColumns = {
          ...columns,
          [taskData.status]: { // <--- Use taskData.status
            ...column,
            taskIds: [...column.taskIds, newTaskId],
          },
        };

        setTasks(updatedTasks);
        setColumns(updatedColumns);

        await axios.post(`${backendUrl}/tasks`, newTask);
        await updateBackend(updatedTasks, updatedColumns);
        showSnackbar("Task created successfully");
      }
    } catch (error) {
      console.error("Failed to save task:", error);
      showSnackbar("Failed to save task", "error");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task permanently?")) return;

    const updatedTasks = { ...tasks };
    delete updatedTasks[taskId];

    const updatedColumns = { ...columns };
    Object.keys(updatedColumns).forEach((columnId) => {
      updatedColumns[columnId] = {
        ...updatedColumns[columnId],
        taskIds: updatedColumns[columnId].taskIds.filter((id) => id !== taskId),
      };
    });

    setTasks(updatedTasks);
    setColumns(updatedColumns);

    try {
      await axios.delete(`${backendUrl}/tasks/${taskId}`);
      updateBackend(updatedTasks, updatedColumns); // Ensure backend is updated after delete
      showSnackbar("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
      showSnackbar("Failed to delete task", "error");
      setTasks(tasks); // Revert on error
      setColumns(columns); // Revert on error
    }
  };

  const fetchArchivedTasks = async () => {
    try {
      const res = await axios.get(`${backendUrl}/archived-tasks`);
      setArchivedTasks(res.data.archivedTasks || {});
    } catch (error) {
      console.error("Failed to fetch archived tasks:", error);
      showSnackbar("Failed to load archived tasks", "error");
    }
  };

  const handleArchiveTask = async (taskId) => {
    try {
      const taskToArchive = tasks[taskId]; // Get the task before it's deleted from active
      await axios.post(`${backendUrl}/tasks/${taskId}/archive`);

      const updatedTasks = { ...tasks };
      delete updatedTasks[taskId];

      const updatedColumns = { ...columns };
      Object.keys(updatedColumns).forEach((columnId) => {
        updatedColumns[columnId] = {
          ...updatedColumns[columnId],
          taskIds: updatedColumns[columnId].taskIds.filter((id) => id !== taskId),
        };
      });

      setTasks(updatedTasks);
      setColumns(updatedColumns);
      setArchivedTasks(prev => ({ // Update archivedTasks in state
        ...prev,
        [taskId]: { ...taskToArchive, archivedAt: new Date().toISOString() }
      }));
      updateBackend(updatedTasks, updatedColumns); // Update backend after archive
      showSnackbar("Task archived successfully");
    } catch (error) {
      console.error("Failed to archive task:", error);
      showSnackbar("Failed to archive task", "error");
    }
  };

  const handleRestoreTask = async (taskId) => {
    try {
      await axios.post(`${backendUrl}/tasks/${taskId}/restore`);
      await fetchData(); // Re-fetch all data to ensure consistency on the board
      await fetchArchivedTasks(); // Re-fetch archived tasks to remove the restored one
      showSnackbar("Task restored successfully");
    } catch (error) {
      console.error("Failed to restore task:", error);
      showSnackbar("Failed to restore task", "error");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <AppBar position="static" sx={{ mb: 3, borderRadius: 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Kanban Board
          </Typography>
          <Button
            color="inherit"
            startIcon={<ArchiveIcon />}
            onClick={() => {
              setArchiveDialogOpen(true);
              fetchArchivedTasks();
            }}
          >
            Archived Tasks
          </Button>
        </Toolbar>
      </AppBar>

      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", minHeight: "70vh", pb: 2 }}>
          {Object.values(columns).map((column) => (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              title={column.title}
              tasks={column.taskIds.map((taskId) => tasks[taskId]).filter(Boolean)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onArchiveTask={handleArchiveTask}
            />
          ))}
        </Box>
      </DragDropContext>

      <AddEditTaskDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTask(null); // Clear editing task when dialog closes
        }}
        onAdd={handleAddTaskSubmit}
        task={editingTask}
        isEditing={!!editingTask}
        initialColumnId={activeColumn} // <--- IMPORTANT CHANGE HERE
      />

      <ArchivedTasksDialog
        open={archiveDialogOpen}
        onClose={() => setArchiveDialogOpen(false)}
        archivedTasks={archivedTasks}
        onRestore={handleRestoreTask}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}