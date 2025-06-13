import SignatureCanvas from 'react-signature-canvas'
import React, { useState, useRef } from 'react';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import axios from 'axios';
import fetchConf from '../../fetchConfig';




const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  sigContainer: {
    width: '80%',
    height: '80%',
    margin: '0 auto',
    backgroundColor: '#fff',
  },
  sigPad: {
    width: '100%',
    height: '200px',
    border: 'black 1px solid',
    // marginTop: '10px',
  },

}));



export default function Signature(
  {
    show,
    orderViewd,
    orderId,
    setModalContent,
    setShowModal,
    resetData = () => { },
    isSinged,
    signatureObject = {
      isSinged: false,
      comment: null,
      signatureBASE64: null
    }
  }) {
  const ref = useRef(null);
  const classes = useStyles();
  let sigCanvas = {};
  //console.log("signatureObject ", signatureObject)
  const sendSignatureAndComments = async (sigRef, ref) => {
    console.log("sigRef ", sigRef);
    console.log("orderViewd ", orderViewd)
    // console.log('sgsgs', resetData);
    if (sigRef.isEmpty()) {
      setModalContent({
        title: "שגיאה",
        content: "נא לחתום לפני השליחה",
      })
      setShowModal(true);
      return;
    }
    if (!orderViewd) {
      setModalContent({
        title: "שגיאה",
        content: "יש להתבונן בתיאור ההזמנה לפני החתימה",
      })
      setShowModal(true);
      return;
    }
    else {
      const data = {
        orderId,
        Sig: sigRef.toDataURL('image/png'),
        comment: ref.current.value
      }
      console.log("orderId:", orderId);
      try {
        const result = await axios.post(`${fetchConf}/signedOrder`, data)
        setModalContent({
          title: "הפרטים נשלחו",
          content: "הפרטים נשלחו בהצלחה!",
          speacilFunction: resetData
        });
        resetData();
        setShowModal(true);
        // console.log(sigRef.toData());
      } catch (e) {
        setModalContent({
          title: "שגיאה",
          content: "קיימת שגיאה בשליחת הנתונים, אנא נסו שנית.",
        })
        setShowModal(true);
        console.log("Error trying to sent sig info, ", e);
      }
    }
  }


  if (show) {
    return (
      <Container component="main" maxWidth="xs" style={{ overflowX: 'hidden', borderBlockColor: 'black' }}>
        <CssBaseline />
        {/*console.log(signatureObject)*/}
        <Box sx={{ display: "flex", flexDirection: "column", alignContent: 'space-between' }}>
          <TextareaAutosize
            aria-label="הערות נוספות"
            placeholder="הערות למשלוח"
            style={{ width: '100%', minHeight: '10%', marginTop: '20px', direction: 'rtl' }}
            id='comment_area'
            ref={ref}
            defaultValue={signatureObject.comment ? signatureObject.comment : null}
            disabled={signatureObject.isSinged ? true : false}
          />
          <div
            style={{
              textAlign: 'center',
              fontWeight: '300',
              marginTop: '20px',
            }}
          >
            חתום כאן
          </div>
          {!signatureObject.signatureBASE64 ? <SignatureCanvas
            canvasProps={{ className: classes.sigPad }}
            ref={(ref) => { sigCanvas = ref }}
          /> : <img src={signatureObject.signatureBASE64} />
          }
          <Button
            fullWidth
            variant="contained"
            color="primary"
            style={{ marginTop: '10px', marginBottom: '10px' }}
            onClick={() => { sendSignatureAndComments(sigCanvas, ref) }}
            disabled={isSinged}
          >
            שלח
          </Button>
        </Box>
      </Container>
    );
  }
  return null;
}
