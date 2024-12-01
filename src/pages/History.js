import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './Auth'; // Adjust the import path as needed
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Container, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

import { Link } from 'react-router-dom';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const History = () => {
  const [history, setHistory] = useState([]);
  const { authUser } = useContext(AuthContext);
  const db = getFirestore();

  //title = "History"


  useEffect(() => {
    const fetchHistory = async () => {
      const q = query(
        collection(db, "coverletters"),
        where("email", "==", authUser.user.email),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    };

    fetchHistory();
  }, [authUser.user.email, db]);

  return (
    <Container maxWidth="md">
      <Box sx={{ flexGrow: 1, my: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Item>
              <Typography variant="h4" gutterBottom>
                Previous Cover Letters
              </Typography>
              <TableContainer component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date Time</TableCell>
                      <TableCell>Document</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell component="th" scope="row">
                          {row.createdAt.toDate().toLocaleString()}
                        </TableCell>
                        <TableCell><Link to={`/view/${row.id}`}>{row.id}</Link></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default History;
