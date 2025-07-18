import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
} from "@mui/material";

export function ArchivedTasksDialog({ open, onClose, archivedTasks, onRestore }) {
  
  const tasks = archivedTasks || {};

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Archived Tasks</DialogTitle>
      <DialogContent>
        {Object.keys(tasks).length === 0 ? (
          <Typography variant="body2">No archived tasks</Typography>
        ) : (
          <List>
            {Object.values(tasks).map((task) => (
              <ListItem
                key={task.id}
                secondaryAction={
                  <Button variant="outlined" onClick={() => onRestore(task.id)}>
                    Restore
                  </Button>
                }
              >
                <ListItemText
                  primary={task.title}
                  secondary={task.description || "No description"}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
