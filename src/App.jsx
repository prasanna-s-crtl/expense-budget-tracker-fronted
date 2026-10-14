import { useState } from "react";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {

    const [page, setPage] = useState(
        localStorage.getItem("token")
            ? "dashboard"
            : "login"
    );

    const handleLogin = () => {
        setPage("dashboard");
    };

    const handleLogout = () => {
        setPage("login");
    };

    return (
        <div>

            {page === "login" && (
                <>
                    <Login onLogin={handleLogin} />

                    <div style={styles.navigation}>

                        <button
                            onClick={() => setPage("register")}
                            style={styles.button}
                        >
                            Create Account
                        </button>

                    </div>
                </>
            )}

            {page === "register" && (
                <>
                    <Register />

                    <div style={styles.navigation}>

                        <button
                            onClick={() => setPage("login")}
                            style={styles.button}
                        >
                            Already have an account? Login
                        </button>

                    </div>
                </>
            )}

            {page === "dashboard" && (
                <Dashboard onLogout={handleLogout} />
            )}

        </div>
    );
}

const styles = {

    navigation: {
        position: "fixed",
        bottom: "30px",
        left: "0",
        right: "0",
        textAlign: "center",
        zIndex: 1000
    },

    button: {
        padding: "12px 22px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        backgroundColor: "#333",
        color: "white",
        fontSize: "15px"
    }
};

export default App;