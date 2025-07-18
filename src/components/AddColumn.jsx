import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from "@mui/material";
import { useState } from "react";

export function AddColumnDialog({ open, onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState("");

  const handleAdd = () => {
    if (title.trim() && columnId.trim()) {
      onAdd({ id: columnId.trim(), title: title.trim(), taskIds: [] });
      setTitle("");
      setColumnId("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Column</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Column ID"
            value={columnId}
            onChange={(e) => setColumnId(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Column Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd}>
          Add Column
        </Button>
      </DialogActions>
    </Dialog>
  );
}
