import React, { useState, useEffect, useRef } from "react";
import {
    Container,
    Typography,
    TextField,
    IconButton,
    Box,
    Skeleton,
    Grid,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { marked } from "marked";

const ChatApp = () => {
    const [inputMessage1, setInputMessage1] = useState("");
    const [inputMessage2, setInputMessage2] = useState("");
    const [ws1, setWs1] = useState(null);
    const [ws2, setWs2] = useState(null);
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [streamedResponse1, setStreamedResponse1] = useState("");
    const [streamedResponse2, setStreamedResponse2] = useState("");

    const [messages1, setMessages1] = useState([]);
    const [messages2, setMessages2] = useState([]);

    const messagesEndRef1 = useRef(null);
    const messagesEndRef2 = useRef(null);

    useEffect(() => {
        const socket1 = new WebSocket("ws://localhost:8000/ws");
        const socket2 = new WebSocket("ws://localhost:8000/ws");
        setWs1(socket1);
        setWs2(socket2);

        socket1.onopen = () => {
            console.log("WebSocket connection established for column 1");
        };

        socket1.onmessage = (event) => {
            const processedResponse = marked(event.data);
            setMessages1((prevMessages) => {
                const updatedMessages = [...prevMessages];
                if (
                    updatedMessages.length === 0 ||
                    updatedMessages[updatedMessages.length - 1].role !==
                        "assistant"
                ) {
                    updatedMessages.push({
                        role: "assistant",
                        content: processedResponse,
                    });
                } else {
                    updatedMessages[updatedMessages.length - 1].content =
                        processedResponse;
                }
                return updatedMessages;
            });
            setLoading1(false);
        };

        socket1.onerror = (error) => {
            console.error("WebSocket error for column 1:", error);
        };

        socket1.onclose = (event) => {
            console.log(
                "WebSocket connection closed for column 1:",
                event.code,
                event.reason
            );
            setLoading1(false);
        };

        socket2.onopen = () => {
            console.log("WebSocket connection established for column 2");
        };

        socket2.onmessage = (event) => {
            const processedResponse = marked(event.data);
            setMessages2((prevMessages) => {
                const updatedMessages = [...prevMessages];
                if (
                    updatedMessages.length === 0 ||
                    updatedMessages[updatedMessages.length - 1].role !==
                        "assistant"
                ) {
                    updatedMessages.push({
                        role: "assistant",
                        content: processedResponse,
                    });
                } else {
                    updatedMessages[updatedMessages.length - 1].content =
                        processedResponse;
                }
                return updatedMessages;
            });
            setLoading2(false);
        };

        socket2.onerror = (error) => {
            console.error("WebSocket error for column 2:", error);
        };

        socket2.onclose = (event) => {
            console.log(
                "WebSocket connection closed for column 2:",
                event.code,
                event.reason
            );
            setLoading2(false);
        };

        return () => {
            socket1.close();
            socket2.close();
        };
    }, []);

    const sendMessage = (
        ws,
        inputMessage,
        setInputMessage,
        setLoading,
        setMessages
    ) => {
        if (inputMessage.trim() !== "") {
            const messageData = {
                message: inputMessage,
            };

            ws.send(JSON.stringify(messageData));
            setMessages((prevMessages) => [
                ...prevMessages,
                { role: "user", content: inputMessage },
            ]);
            setInputMessage("");
            setLoading(true);
        }
    };

    const handleKeyPress = (
        event,
        ws,
        inputMessage,
        setInputMessage,
        setLoading,
        setMessages
    ) => {
        if (event.key === "Enter") {
            sendMessage(
                ws,
                inputMessage,
                setInputMessage,
                setLoading,
                setMessages
            );
        }
    };

    useEffect(() => {
        if (!loading1 && streamedResponse1) {
            setMessages1((prevMessages) => [
                ...prevMessages,
                { role: "assistant", content: streamedResponse1 },
            ]);
            setStreamedResponse1("");
            messagesEndRef1.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [loading1, streamedResponse1]);

    useEffect(() => {
        if (!loading2 && streamedResponse2) {
            setMessages2((prevMessages) => [
                ...prevMessages,
                { role: "assistant", content: streamedResponse2 },
            ]);
            setStreamedResponse2("");
            messagesEndRef2.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [loading2, streamedResponse2]);

    return (
        <Container maxWidth="x2">
            <Typography variant="h4" align="center" gutterBottom>
                Generative AI Collaboration
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    {/* Chat column 1 */}
                    <Box
                        sx={{
                            height: "auto",
                            overflowY: "auto",
                            marginBottom: "20px",
                        }}
                    >
                        {messages1.map((message, index) => (
                            <Typography
                                key={index}
                                sx={{
                                    backgroundColor:
                                        message.role === "user"
                                            ? "#cccccc"
                                            : "#f0f0f0",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    marginBottom: "10px",
                                }}
                            >
                                {message.role === "user" ? (
                                    message.content
                                ) : (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: message.content,
                                        }}
                                    />
                                )}
                            </Typography>
                        ))}
                        {loading1 &&
                            messages1.length > 0 &&
                            messages1[messages1.length - 1].role !==
                                "assistant" && (
                                <>
                                    <Skeleton
                                        variant="text"
                                        animation="pulse"
                                        width="100%"
                                    />
                                    <Skeleton
                                        variant="text"
                                        animation="wave"
                                        width="100%"
                                    />
                                    <Skeleton
                                        variant="text"
                                        animation="pulse"
                                        width="100%"
                                    />
                                </>
                            )}
                        <div ref={messagesEndRef1} />
                    </Box>
                    <Box display="flex" alignItems="center">
                        <TextField
                            label="Enter your message"
                            variant="outlined"
                            fullWidth
                            value={inputMessage1}
                            onChange={(e) => setInputMessage1(e.target.value)}
                            onKeyDown={(e) =>
                                handleKeyPress(
                                    e,
                                    ws1,
                                    inputMessage1,
                                    setInputMessage1,
                                    setLoading1,
                                    setMessages1
                                )
                            }
                        />
                        <IconButton
                            color="primary"
                            onClick={() =>
                                sendMessage(
                                    ws1,
                                    inputMessage1,
                                    setInputMessage1,
                                    setLoading1,
                                    setMessages1
                                )
                            }
                            sx={{ marginLeft: "10px" }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    {/* Chat column 2 */}
                    <Box
                        sx={{
                            height: "auto",
                            overflowY: "auto",
                            marginBottom: "20px",
                        }}
                    >
                        {messages2.map((message, index) => (
                            <Typography
                                key={index}
                                sx={{
                                    backgroundColor:
                                        message.role === "user"
                                            ? "#cccccc"
                                            : "#f0f0f0",
                                    padding: "10px",
                                    borderRadius: "5px",
                                    marginBottom: "10px",
                                }}
                            >
                                {message.role === "user" ? (
                                    message.content
                                ) : (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: message.content,
                                        }}
                                    />
                                )}
                            </Typography>
                        ))}
                        {loading2 &&
                            messages2.length > 0 &&
                            messages2[messages2.length - 1].role !==
                                "assistant" && (
                                <>
                                    <Skeleton
                                        variant="text"
                                        animation="pulse"
                                        width="100%"
                                    />
                                    <Skeleton
                                        variant="text"
                                        animation="wave"
                                        width="100%"
                                    />
                                    <Skeleton
                                        variant="text"
                                        animation="pulse"
                                        width="100%"
                                    />
                                </>
                            )}
                        <div ref={messagesEndRef2} />
                    </Box>
                    <Box display="flex" alignItems="center">
                        <TextField
                            label="Enter your message"
                            variant="outlined"
                            fullWidth
                            value={inputMessage2}
                            onChange={(e) => setInputMessage2(e.target.value)}
                            onKeyDown={(e) =>
                                handleKeyPress(
                                    e,
                                    ws2,
                                    inputMessage2,
                                    setInputMessage2,
                                    setLoading2,
                                    setMessages2
                                )
                            }
                        />
                        <IconButton
                            color="primary"
                            onClick={() =>
                                sendMessage(
                                    ws2,
                                    inputMessage2,
                                    setInputMessage2,
                                    setLoading2,
                                    setMessages2
                                )
                            }
                            sx={{ marginLeft: "10px" }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ChatApp;