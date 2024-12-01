import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './Auth.js'; // Adjust the import path as needed
import { fetchUsers, updateUser } from './firestoreService'; // Import CRUD functions
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Select, MenuItem, IconButton, Paper, Grid // TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

function Admin() {
    const [users, setUsers] = useState([]);
    const [editIdx, setEditIdx] = useState(-1);
    
    const { firestoreInstance } = useContext(AuthContext);
// update rules to disallow changing own role!!!
    useEffect(() => {
      const fetchData = async () => {
          try {
              const users = await fetchUsers(firestoreInstance); // Use the service function
              setUsers(users);
          } catch (err) {
              console.error("Error fetching users: ", err);
          }
      };
      fetchData();
  }, [firestoreInstance]); // dependency array

    const handleSave = async (id, role) => {
        try {
            await updateUser(firestoreInstance, id, {role}); // Use updateUser function
            setEditIdx(-1);
        } catch (err) {
            console.error("Error updating user: ", err);
        }
    };

    return (
        <Grid item xs={12}>
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        {/* <TableCell>Team</TableCell> */}
                        <TableCell>Edit</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user, idx) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.displayName}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                {editIdx === idx ? (
                                    <Select
                                        value={user.role}
                                        onChange={e => setUsers(users.map(u => u.id === user.id ? { ...u, role: e.target.value } : u))}
                                    >
                                        <MenuItem value="Standard">Standard</MenuItem>
                                        <MenuItem value="Premium">Premium</MenuItem>
                                        <MenuItem value="Admin">Admin</MenuItem>
                                    </Select>
                                ) : user.role}
                            </TableCell>
                            {/* <TableCell>
                                {editIdx === idx ? (
                                    <TextField
                                        value={user.team}
                                        onChange={e => setUsers(users.map(u => u.id === user.id ? { ...u, team: e.target.value } : u))}
                                    />
                                ) : user.team}
                            </TableCell> */}
                            <TableCell>
                                {editIdx === idx ? (
                                    <IconButton onClick={() => handleSave(user.id, user.role)}>
                                        <SaveIcon />
                                    </IconButton>
                                ) : (
                                    <IconButton onClick={() => setEditIdx(idx)}>
                                        <EditIcon />
                                    </IconButton>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        </Grid>
    );
}

export default Admin;
