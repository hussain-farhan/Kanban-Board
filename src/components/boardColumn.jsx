import { Paper, Typography, Button, Box, IconButton } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { Droppable } from "@hello-pangea/dnd";
import { TaskCard } from "./taskCard";

// The new onDeleteColumn prop is added here
export function KanbanColumn({ columnId, title, tasks, onAddTask, onDeleteTask, onEditTask, onArchiveTask, onDeleteColumn }) {
  const getColumnColor = (columnId) => {
    switch (columnId) {
      case "todo":
        return "#e3f2fd";
      case "inprogress":
        return "#fff3e0";
      case "done":
        return "#e8f5e8";
      default:
        return "#f5f5f5";
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        minHeight: 500,
        width: 300,
        backgroundColor: getColumnColor(columnId),
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {tasks.filter((t) => t && t.id).length}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onDeleteColumn(columnId)} // NEW: Call the delete function
          aria-label="delete column"
          color="error"
          sx={{ '&:hover': { color: 'error.dark' } }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onAddTask(columnId)}
        sx={{ mb: 2 }}
        fullWidth
      >
        Add Task
      </Button>

      <Droppable droppableId={String(columnId)}>
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flex: 1,
              backgroundColor: snapshot.isDraggingOver ? "rgba(0, 0, 0, 0.05)" : "transparent",
              borderRadius: 1,
              transition: "background-color 0.2s ease",
              minHeight: 100,
            }}
          >
            {tasks
              .filter((task) => task && task.id)
              .map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onDelete={onDeleteTask}
                  onEdit={onEditTask}
                  onArchive={onArchiveTask}
                />
              ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
}