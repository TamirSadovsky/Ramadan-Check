import { Signature } from "../index";

import { Logo, BarcodeReader, BackToNavBtn } from "../../components/index";
import fetchConf from "../../fetchConfig";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";

import React, { useState, useRef, useEffect } from "react";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import { ScrollView } from "react-native";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import ReactModal, { setAppElement } from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faBarcode,
} from "@fortawesome/free-solid-svg-icons";

const axios = require("axios");

// Order test number 2001112

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "100%",
    // marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatar: {
    margin: theme.spacing(0),
    // backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function OrderPage({
  showOrderPage,
  setshowOrderPage,
  Table,
  Modal,
  setShowOverlayLoader,
  setShowButtons,
}) {
  const classes = useStyles();
  const [showTable, setshowTable] = useState(false);
  const [signatureObject, setSignatureObject] = useState(null);
  const [clientId, setclinetId] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rowsData, setRowsData] = useState(true);
  const [modalContent, setModalContent] = useState({});
  const [orderViewd, setOrderViewd] = useState(false);
  const [showOrderModal, setOrderShowModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [orderIdNum, setOrderId] = useState(null);
  const [showBarcodeComponenet, setShowBarcodeComponenet] = useState(false);
  const orderIdRef = useRef(null);
  const [data, setData] = React.useState("Not Found");
  const [cachedDocIds, setCachedDocIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const resetData = () => {
    setclinetId(null);
    setRowsData(null);
    setShowOverlayLoader(false);
    setshowTable(false);
    setSignatureObject(null);
  };

  const onDetect = (result) => {
    //console.log(result.codeResult.code);
    orderIdRef.current.focus();
    orderIdRef.current.value = result.codeResult.code;
    setShowBarcodeComponenet(false);
  };


  const fetchNearbyDocId = async (currentDocId, direction) => {
    try {
      const parsedId = Number(currentDocId) || 9999999;
      const isInitial = parsedId === 9999999;
      console.log("📥 בקשת getCustomersList עם docId:", parsedId, " | כיוון:", direction, " | התחלה?", isInitial);

      let docIds = [...cachedDocIds];
      let docIds_newer = [];
      let docIds_older = [];

      if (docIds.length === 0 || !docIds.includes(parsedId)) {
        console.log("📦 שליפה ראשונית מהשרת כי הרשימה ריקה או התעודה לא קיימת");

        const response = await axios.get(`${fetchConf}/getCustomersList`, {
          params: { docId: parsedId },
        });

        const [newer = [], older = []] = response.data;
        docIds_newer = [...newer];
        docIds_older = [...older];
        docIds = [...docIds_older.reverse(), ...docIds_newer];
        setCachedDocIds(docIds);
        console.log("📦 תעודות מהשרת:", docIds);

        if (isInitial) {
          const newDocId = docIds[docIds.length - 1];
          if (newDocId) {
            console.log("✅ התחלה מ־9999999. מציגים את הכי חדש:", newDocId);
            orderIdRef.current.value = newDocId;
            setCurrentIndex(docIds.length - 1);
            resetData();
            setOrderId(newDocId);
            setTimeout(() => {
              orderData(newDocId);
            }, 0);
          }
          return;
        }
      }

      let index = docIds.findIndex(id => id === parsedId);
      if (index === -1) {
        index = 0;
        console.warn(`⚠️ מספר תעודה ${parsedId} לא נמצא ברשימה. מתחילים מ־index ${index}`);
      }

      let newIndex = index;

      if (direction === "up" && index < docIds.length - 1) {
        newIndex = index + 1;
        console.log("⬆️ מעבר למעלה בתוך הרשימה הקיימת. index החדש:", newIndex);
      } else if (direction === "down" && index > 0) {
        newIndex = index - 1;
        console.log("⬇️ מעבר למטה בתוך הרשימה הקיימת. index החדש:", newIndex);
      } else {
        if ((isInitial && direction === "up") || (!isInitial && ((direction === "up" && index === docIds.length - 1)))) {
          console.warn("⛔ הגעת לסוף הרשימה — עצירה.");
          alert("הגעת לסוף הרשימה");
          return;
        }

        const edgeDocId = direction === "up" ? docIds[docIds.length - 1] : docIds[0];
        console.log("📶 שליפה נוספת מהשרת כי הגענו לקצה. docId קצה:", edgeDocId);

        const response = await axios.get(`${fetchConf}/getCustomersList`, {
          params: { docId: edgeDocId },
        });

        const [newer = [], older = []] = response.data;
        const newList = [...newer.reverse(), ...older];
        const filtered = newList.filter(id => !docIds.includes(id));

        console.log("📦 תוצאות שליפה נוספת:", newList);
        console.log("📤 תעודות חדשות אחרי סינון:", filtered);

        if (filtered.length === 0) {
          console.warn("📍 אין תעודות חדשות בכיוון:", direction);
          alert("הגעת לסוף הרשימה");
          return;
        }

        if (direction === "up") {
          docIds = [...docIds, ...filtered];
          newIndex = docIds.length - filtered.length;
        } else {
          docIds = [...filtered, ...docIds];
          newIndex = filtered.length - 1;
        }

        setCachedDocIds(docIds);
        console.log("📦 רשימה עודכנה לאחר שליפה נוספת:", docIds);
      }

      const newDocId = docIds[newIndex];
      if (newDocId) {
        console.log("✅ הצגת תעודת משלוח:", newDocId);
        orderIdRef.current.value = newDocId;
        setCurrentIndex(newIndex);

        resetData();
        setOrderId(newDocId);
        setTimeout(() => {
          orderData(newDocId);
        }, 0);
      }
    } catch (error) {
      console.error("❌ שגיאה ב־fetchNearbyDocId:", error);
    }
  };


  const orderData = async (orderId) => {
    const rows = [];
    try {
      setShowOverlayLoader(true);
      // const orderData = await axios.get("http://192.168.31.159:3000/getOrderDetails", {
      const orderData = await axios.get(`${fetchConf}/getOrderDetails`, {
        params: {
          orderId,
        },
        timeout: 5000,
      });
      const resolvedData = await orderData;
      // console.log(resolvedData.data.recordset[0].CustomerName);
      // console.log(resolvedData);
      if (
        resolvedData?.data?.comments &&
        resolvedData?.data?.comments?.length > 0
      ) {
        setModalContent({
          title: "הוראות מיוחדת להורדת סחורה:",
          content: resolvedData?.data?.comments,
        });
        setShowModal(true);
      }

      for (let ele of resolvedData.data.recordset) {
        rows.push({
          name: ele.HashDes,
          meatType: ele.GenerlDes,
          boxId: ele.BoxNum,
          weight: ele.Wight.toFixed(3),
          barCode: ele.BarCode,
        });
      }
      if (rows.length <= 0) {
        setModalContent({
          title: "שגיאה",
          content: "לא נמצאו הזמנות",
        });
        setShowModal(true);
        resetData();
        return;
      }
      rows.isSinged = resolvedData.data.signatureObject.isSinged;
      setRowsData(rows);
      rows.length > 0
        ? setclinetId(resolvedData.data.recordset[0].CustomerName)
        : null;
      /*
    console.log(
      "resolvedData.data.signatureObject ",
      resolvedData.data.signatureObject
    ); */
      setSignatureObject(resolvedData.data.signatureObject);
      if (resolvedData.data.signatureObject.isSinged) {
        setModalContent({
          title: "שימו לב!",
          content:
            "ההזמנה כבר חתומה, ניתן לראות את פרטי ההזמנה אך לא ניתן לחתום שוב.",
        });
        setShowModal(true);
      }
      setShowOverlayLoader(false);
      setshowTable(true);
      //console.log("Leangth: ", resolvedData.data.recordset.length);
    } catch (e) {
      setModalContent({
        title: "שגיאה",
        content: "שגיאה במשיכת נתוני ההזמנה, אנא נסו שוב מאוחר יותר",
      });
      setShowModal(true);
      setShowOverlayLoader(false);
      console.log("Error occured while getting order data: ", e);
    }
  };

  if (showOrderPage) {
    return (
      <ScrollView
        vertical={true}
        style={{ backgroundColor: "#fff", Height: "100%" }}
      >
        <Container
          component="main"
          maxWidth="xs"
          style={{ overflowX: "hidden", height: "100" }}
        >
          <Modal
            show={showModal}
            color="primary"
            content={modalContent.content}
            title={modalContent.title}
            buttonText="אישור"
            toggleShowModal={setShowModal}
            speacilFunction={modalContent.speacilFunction}
          ></Modal>
          <CssBaseline />
          <div className={classes.paper}>
            {/* <Box sx={{ marginBottom: '30px', marginTop: '30px', textAlign: 'center' }}>
              <div className={classes.avatar}>
                <Logo />
              </div>
            </Box> */}
            <Typography component="h1" variant="h5">
              תעודת משלוח
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row-reverse",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                marginTop: 2,
                overflow: "visible",
              }}
            >
              {/* כפתור ברקוד */}
              <Button
                variant="outlined"
                color="primary"
                sx={{ height: 56, width: 56, minWidth: 56 }}
                onClick={() => setShowBarcodeComponenet(true)}
              >
                <FontAwesomeIcon icon={faBarcode} style={{ fontSize: 20 }} />
              </Button>

              {/* כפתור חיפוש */}
              <Button
                variant="outlined"
                color="primary"
                sx={{ height: 56, width: 56, minWidth: 56 }}
                onClick={() => {
                  resetData();
                  setOrderId(orderIdRef.current.value);
                  orderData(orderIdRef.current.value);
                }}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: 20 }} />
              </Button>

              {/* שדה קלט + חיצים בתוך Box אחד */}
              <Box sx={{ display: "flex", flexDirection: "row-reverse", alignItems: "center", border: "1px solid #c4c4c4", borderRadius: "4px", overflow: "hidden", height: 56 }}>
                {/* חיצים אנכיים */}
                <Box sx={{ display: "flex", flexDirection: "column", width: 40, borderLeft: "1px solid #c4c4c4" }}>
                  <Button
                    variant="text"
                    sx={{ height: "50%", minWidth: "100%", padding: 0 }}
                    onClick={() => fetchNearbyDocId(orderIdRef.current.value, "up")}
                  >
                    <FontAwesomeIcon icon={faChevronUp} />
                  </Button>
                  <Button
                    variant="text"
                    sx={{ height: "50%", minWidth: "100%", padding: 0 }}
                    onClick={() => fetchNearbyDocId(orderIdRef.current.value, "down")}
                  >
                    <FontAwesomeIcon icon={faChevronDown} />
                  </Button>
                </Box>


                {/* שדה קלט */}
                <TextField
                  id="orderId"
                  placeholder="מס׳ ת.משלוח"
                  variant="standard"
                  inputRef={orderIdRef}
                  type="number"
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    if (cachedDocIds.includes(newId)) {
                      resetData();
                      setOrderId(newId);
                      orderData(newId);
                    }
                  }}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      height: 56,
                      paddingX: 2,
                      textAlign: "right",
                      direction: "rtl",
                      fontSize: 16,
                    },
                  }}
                  sx={{
                    flexGrow: 1,
                    width: 250,
                    height: 56,
                    '& input': {
                      padding: 0,
                      direction: 'rtl',
                      textAlign: 'right',
                    },
                  }}
                />

              </Box>
            </Box>

            {showBarcodeComponenet && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <BarcodeReader
                    style={{ marginTop: "5px" }}
                    onDetect={onDetect}
                  />
                  <Button
                    variant="outlined"
                    // id="searchOrderBtn"
                    style={{ right: "5px" }}
                    color="primary"
                    onClick={() => {
                      setShowBarcodeComponenet(false);
                    }}
                  >
                    סגור
                  </Button>
                </Box>
              </>
            )}
            <>
              {showTable && (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      marginBottom: "10px",
                      marginTop: "10px",
                      maxWidth: "100%",
                    }}
                  >
                    <TextField
                      disabled
                      style={{ textAlign: "right" }}
                      id="outlined-disabled"
                      variant="outlined"
                      label="לקוח"
                      defaultValue={clientId}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      marginTop: "10px",
                      overflowX: "scroll",
                      maxWidth: "100%",
                    }}
                  >
                    <Button
                      color="primary"
                      variant="contained"
                      onClick={() => {
                        setOrderShowModal(true);
                        setOrderViewd(true);
                      }}
                    >
                      הצג תעודת משלוח
                    </Button>
                    <ReactModal
                      appElement={document.getElementById("root")}
                      isOpen={showOrderModal}
                      style={{
                        content: {
                          inset: "0",
                        },
                      }}
                    >
                      <Table rows={rowsData} show={!isLoaded}></Table>
                      <br />
                      <Button
                        color="primary"
                        variant="contained"
                        id="searchOrderBtn"
                        style={{
                          margin: "0 auto",
                          width: "100%",
                        }}
                        onClick={() => {
                          setOrderShowModal(false);
                          // setOrderViewd(true);
                        }}
                      >
                        סגור חלון
                      </Button>
                    </ReactModal>

                    <Signature
                      show={!isLoaded}
                      orderViewd={orderViewd}
                      orderId={orderIdNum}
                      setShowModal={setShowModal}
                      setModalContent={setModalContent}
                      resetData={resetData}
                      isSinged={rowsData ? rowsData.isSinged : null}
                      signatureObject={signatureObject}
                    />
                  </Box>
                </>
              )}
              {/* <ThreeDots 
                   height="100" 
                   width="100" 
                   radius="9"
                   color="#4fa94d" 
                   ariaLabel="three-dots-loading"
                   // wrapperStyle={{}}
                   // wrapperClassName=""
                   visible={isLoaded}
              />    */}
            </>
            <BackToNavBtn
              setShowCurr={setshowOrderPage}
              setShowButtons={setShowButtons}
            />
          </div>
        </Container>
      </ScrollView>
    );
  } else return null;
}
