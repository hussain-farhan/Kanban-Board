import { Card, CardContent, Typography, IconButton, Chip, Box, Tooltip } from "@mui/material";
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon, 
  Archive as ArchiveIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon 
} from "@mui/icons-material";
import { Draggable } from "@hello-pangea/dnd";

export function TaskCard({ task, index, onDelete, onEdit, onArchive }) {
  if (!task || !task.id || !task.title || !task.priority) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };
  
  const isDueSoon = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const getDueDateColor = (dueDate) => {
    if (isOverdue(dueDate)) return "error";
    if (isDueSoon(dueDate)) return "warning";
    return "info";
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            cursor: "grab",
            transform: snapshot.isDragging ? "rotate(5deg)" : "none",
            boxShadow: snapshot.isDragging ? 4 : 1,
            "&:hover": {
              boxShadow: 3,
            },
            border: task.dueDate && isOverdue(task.dueDate) ? '2px solid #f44336' : 'none',
          }}
        >
          <CardContent sx={{ pb: "16px !important" }}>
            {/* Header with title and actions */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Typography 
                variant="h6" 
                component="h3" 
                sx={{ 
                  fontSize: "1rem", 
                  fontWeight: 600, 
                  flex: 1,
                  pr: 1
                }}
              >
                {task.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Tooltip title="Edit Task">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(task);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Archive Task">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive(task.id);
                    }}
                  >
                    <ArchiveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Task">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(task.id);
                    }}
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {task.description || "No description"}
            </Typography>

            {/* Due Date */}
            {task.dueDate && (
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <ScheduleIcon 
                  fontSize="small" 
                  sx={{ 
                    mr: 0.5, 
                    color: getDueDateColor(task.dueDate) === 'error' ? 'error.main' : 
                           getDueDateColor(task.dueDate) === 'warning' ? 'warning.main' : 'info.main'
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: getDueDateColor(task.dueDate) === 'error' ? 'error.main' : 
                           getDueDateColor(task.dueDate) === 'warning' ? 'warning.main' : 'text.secondary'
                  }}
                >
                  Due: {formatDate(task.dueDate)}
                  {isOverdue(task.dueDate) && (
                    <WarningIcon 
                      fontSize="small" 
                      sx={{ ml: 0.5, color: 'error.main' }} 
                    />
                  )}
                </Typography>
              </Box>
            )}

            {/* Priority and Status */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Chip
                label={task.priority?.toUpperCase() || "UNKNOWN"}
                size="small"
                color={getPriorityColor(task.priority)}
                variant="outlined"
              />
              {task.dueDate && isDueSoon(task.dueDate) && !isOverdue(task.dueDate) && (
                <Chip
                  label="Due Soon"
                  size="small"
                  color="warning"
                  variant="filled"
                />
              )}
              {task.dueDate && isOverdue(task.dueDate) && (
                <Chip
                  label="Overdue"
                  size="small"
                  color="error"
                  variant="filled"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}