import { useState } from "react";
import api from "../api";

function Login({ onLogin }) {

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (event) => {

        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        try {

            const response = await api.post(
                "/auth/login",
                formData
            );

            console.log(response.data);

            localStorage.setItem(
                "token",
                response.data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: response.data.id,
                    username: response.data.username,
                    email: response.data.email
                })
            );

            setMessage(
                "Login successful! JWT token saved."
            );

            onLogin();

            setFormData({
                username: "",
                password: ""
            });

        } catch (error) {

            console.error(error);

            if (error.response && error.response.data) {
                setError(String(error.response.data));
            } else {
                setError(
                    "Login failed. Please check your username and password."
                );
            }
        }
    };

    return (
        <div style={styles.container}>

            <div style={styles.card}>

                <h1>Expense Budget Tracker</h1>

                <h2>Login</h2>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

                {message && (
                    <p style={styles.success}>
                        {message}
                    </p>
                )}

                {error && (
                    <p style={styles.error}>
                        {error}
                    </p>
                )}

            </div>

        </div>
    );
}

const styles = {

    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f4f6f8"
    },

    card: {
        width: "400px",
        padding: "30px",
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
        textAlign: "center"
    },

    success: {
        color: "green"
    },

    error: {
        color: "red"
    }
};

export default Login;