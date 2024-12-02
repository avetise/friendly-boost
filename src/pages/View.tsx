import React, { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from './Auth'; // Adjust the import path as needed
import { Container, Grid, Paper, TextField, Tooltip, Box, IconButton } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { styled } from '@mui/material/styles';

import { getFirestore, doc,     getDoc } from 'firebase/firestore';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const View = () => {
    const [record, setRecord] = useState('');
    const { id } = useParams(); // Get the id parameter from the URL
    const { authUser } = useContext(AuthContext);
    const db = getFirestore();
  
    useEffect(() => {
      const fetchRecord = async () => {
        const docRef = doc(db, "coverletters", id);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists() && docSnap.data().email == authUser.data.email) {
          setRecord(docSnap.data().message);
        } else {
          console.log("No such document!");
          setRecord('No record found for this ID.');
        }
      };
  
      fetchRecord();
    }, [id, db]);

  const fetchRecord = async () => {
    const docRef = doc(db, "coverletters", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      setRecord(docSnap.data().message);
    } else {
      console.log("No such document!");
      setRecord('No record found for this ID.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(record);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ flexGrow: 1, my: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Item>
              {record && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Copy">
                      <IconButton aria-label="copy" onClick={copyToClipboard}>
                        <ContentPasteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    readOnly
                    value={record}
                    variant="outlined"
                    margin="normal"
                  />
                </>
              )}
            </Item>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default View;
