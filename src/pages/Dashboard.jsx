import { useEffect, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";
import api from "../api";

function Dashboard({ onLogout }) {

    const [user, setUser] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [budget, setBudget] = useState(null);

    const [budgetAmount, setBudgetAmount] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [editingExpenseId, setEditingExpenseId] =
        useState(null);

    const today = new Date();

    const currentMonth =
        today.getFullYear() +
        "-" +
        String(today.getMonth() + 1).padStart(2, "0");

    const getTodayDate = () => {

        const currentDate = new Date();

        return (
            currentDate.getFullYear() +
            "-" +
            String(currentDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(currentDate.getDate()).padStart(2, "0")
        );
    };

    const [expenseForm, setExpenseForm] = useState({
        title: "",
        amount: "",
        category: "",
        description: "",
        expenseDate: getTodayDate()
    });

    useEffect(() => {

        loadUser();
        loadExpenses();
        loadBudget();

    }, []);

    const loadUser = async () => {

        try {

            const savedUser =
                JSON.parse(localStorage.getItem("user"));

            if (!savedUser) {

                onLogout();
                return;
            }

            const response =
                await api.get("/users/" + savedUser.id);

            setUser(response.data);

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load user information."
            );
        }
    };

    const loadExpenses = async () => {

        try {

            const response =
                await api.get("/expenses");

            setExpenses(response.data);

        } catch (err) {

            console.error(err);

            setError(
                "Unable to load expenses."
            );
        }
    };

    const loadBudget = async () => {

        try {

            const response =
                await api.get(
                    "/budgets?month=" + currentMonth
                );

            setBudget(response.data);

            setBudgetAmount(
                response.data.amount
            );

        } catch (err) {

            if (
                !err.response ||
                err.response.status !== 404
            ) {

                console.error(err);
            }
        }
    };

    const handleBudgetSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        try {

            const response =
                await api.post(
                    "/budgets",
                    {
                        month: currentMonth,
                        amount: Number(budgetAmount)
                    }
                );

            setBudget(response.data);

            setMessage(
                "Your monthly budget is saved ✨"
            );

        } catch (err) {

            console.error(err);

            setError(
                "Unable to save monthly budget."
            );
        }
    };

    const handleExpenseChange = (event) => {

        setExpenseForm({
            ...expenseForm,
            [event.target.name]: event.target.value
        });
    };

    const handleExpenseSubmit = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        try {

            if (editingExpenseId !== null) {

                await api.put(
                    "/expenses/" + editingExpenseId,
                    {
                        ...expenseForm,
                        amount: Number(
                            expenseForm.amount
                        )
                    }
                );

                setMessage(
                    "Expense updated successfully ✨"
                );

            } else {

                await api.post(
                    "/expenses",
                    {
                        ...expenseForm,
                        amount: Number(
                            expenseForm.amount
                        )
                    }
                );

                setMessage(
                    "Expense added successfully 🌷"
                );
            }

            setExpenseForm({
                title: "",
                amount: "",
                category: "",
                description: "",
                expenseDate: getTodayDate()
            });

            setEditingExpenseId(null);

            loadExpenses();

        } catch (err) {

            console.error(err);

            setError(
                editingExpenseId !== null
                    ? "Unable to update expense."
                    : "Unable to add expense."
            );
        }
    };

    const handleEditExpense = (expense) => {

        setEditingExpenseId(expense.id);

        setExpenseForm({
            title: expense.title || "",
            amount: expense.amount || "",
            category: expense.category || "",
            description: expense.description || "",
            expenseDate:
                expense.expenseDate ||
                getTodayDate()
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleCancelEdit = () => {

        setEditingExpenseId(null);

        setExpenseForm({
            title: "",
            amount: "",
            category: "",
            description: "",
            expenseDate: getTodayDate()
        });

        setMessage("");
        setError("");
    };

    const handleDeleteExpense = async (expenseId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this expense? 🥺"
            );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                "/expenses/" + expenseId
            );

            setMessage(
                "Expense deleted successfully."
            );

            loadExpenses();

        } catch (err) {

            console.error(err);

            setError(
                "Unable to delete expense."
            );
        }
    };

    const currentMonthExpenses =
        expenses.filter((expense) => {

            return (
                expense.expenseDate &&
                expense.expenseDate.startsWith(
                    currentMonth
                )
            );
        });

    const totalExpenses =
        currentMonthExpenses.reduce(
            (total, expense) => {

                return (
                    total +
                    Number(expense.amount)
                );

            },
            0
        );

    const monthlyBudget =
        budget
            ? Number(budget.amount)
            : 0;

    const remainingBudget =
        monthlyBudget - totalExpenses;

    const budgetPercentage =
        monthlyBudget > 0
            ? (totalExpenses / monthlyBudget) * 100
            : 0;

    let budgetStatus =
        "No Budget Set";

    let budgetStatusColor =
        "#aaa";

    if (monthlyBudget > 0) {

        if (budgetPercentage >= 100) {

            budgetStatus =
                "Over Budget";

            budgetStatusColor =
                "#d98b8b";

        } else if (budgetPercentage >= 80) {

            budgetStatus =
                "Almost There";

            budgetStatusColor =
                "#d6aa67";

        } else {

            budgetStatus =
                "Looking Good ♡";

            budgetStatusColor =
                "#8caf91";
        }
    }

    const categoryTotals = {};

    currentMonthExpenses.forEach(
        (expense) => {

            const category =
                expense.category || "Other";

            if (!categoryTotals[category]) {

                categoryTotals[category] = 0;
            }

            categoryTotals[category] +=
                Number(expense.amount);
        }
    );

    const chartData =
        Object.entries(categoryTotals).map(
            ([category, amount]) => {

                return {
                    name: category,
                    value: amount
                };
            }
        );

    const chartColors = [
        "#d9a7c7",
        "#a8c5b0",
        "#f0c9a5",
        "#b8b5d9",
        "#a8c9d8",
        "#e4b7b7",
        "#c8c0a8"
    ];

    return (

        <div style={styles.page}>

            <div style={styles.doodleTopLeft}>
                ✿
            </div>

            <div style={styles.doodleTopRight}>
                ♡
            </div>

            <div style={styles.doodleBottomLeft}>
                ✧
            </div>

            <div style={styles.doodleBottomRight}>
                ❀
            </div>

            <div style={styles.container}>

                <div style={styles.header}>

                    <div>

                        <div style={styles.smallTitle}>
                            little money diary ✿
                        </div>

                        <h1 style={styles.title}>
                            Expense Budget Tracker
                        </h1>

                        <p style={styles.subtitle}>
                            Keep your spending happy &
                            organized ♡
                        </p>

                    </div>

                    <div style={styles.headerDoodle}>
                        ☁️
                    </div>

                </div>

                {user && (

                    <div style={styles.userCard}>

                        <div style={styles.userEmoji}>
                            🌷
                        </div>

                        <div>

                            <h3 style={styles.welcome}>
                                Welcome, {user.username}!
                            </h3>

                            <p style={styles.softText}>
                                User ID: {user.id}
                            </p>

                            <p style={styles.softText}>
                                {user.email}
                            </p>

                            <p style={styles.authSuccess}>
                                ✨ Your account is secure
                            </p>

                        </div>

                    </div>

                )}

                {message && (

                    <div style={styles.success}>
                        {message}
                    </div>

                )}

                {error && (

                    <div style={styles.error}>
                        {error}
                    </div>

                )}

                <div style={styles.summary}>

                    <div
                        style={{
                            ...styles.summaryBox,
                            backgroundColor: "#fff3f7"
                        }}
                    >

                        <div style={styles.summaryEmoji}>
                            🎀
                        </div>

                        <h3>
                            Monthly Budget
                        </h3>

                        <p style={styles.summaryNumber}>
                            ₹{monthlyBudget.toFixed(2)}
                        </p>

                    </div>

                    <div
                        style={{
                            ...styles.summaryBox,
                            backgroundColor: "#f4f0ff"
                        }}
                    >

                        <div style={styles.summaryEmoji}>
                            🍓
                        </div>

                        <h3>
                            Total Spent
                        </h3>

                        <p style={styles.summaryNumber}>
                            ₹{totalExpenses.toFixed(2)}
                        </p>

                    </div>

                    <div
                        style={{
                            ...styles.summaryBox,
                            backgroundColor: "#eff9f1"
                        }}
                    >

                        <div style={styles.summaryEmoji}>
                            🌱
                        </div>

                        <h3>
                            Remaining
                        </h3>

                        <p
                            style={{
                                ...styles.summaryNumber,
                                color:
                                    remainingBudget >= 0
                                        ? "#78977d"
                                        : "#c78c8c"
                            }}
                        >
                            ₹{remainingBudget.toFixed(2)}
                        </p>

                    </div>

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            🌙
                        </span>

                        <h2>
                            Budget Status
                        </h2>

                    </div>

                    <div
                        style={{
                            ...styles.statusPill,
                            color: budgetStatusColor,
                            backgroundColor:
                                budgetStatus ===
                                "Over Budget"
                                    ? "#fff0f0"
                                    : "#f4f8f4"
                        }}
                    >
                        {budgetStatus}
                    </div>

                    <p style={styles.softText}>
                        You've used{" "}
                        <strong>
                            {budgetPercentage.toFixed(1)}%
                        </strong>{" "}
                        of your monthly budget.
                    </p>

                    <div style={styles.progressBackground}>

                        <div
                            style={{
                                ...styles.budgetProgressBar,
                                width:
                                    Math.min(
                                        budgetPercentage,
                                        100
                                    ) + "%",
                                backgroundColor:
                                    budgetStatusColor
                            }}
                        />

                    </div>

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            🎀
                        </span>

                        <h2>
                            Monthly Budget
                        </h2>

                    </div>

                    <form
                        onSubmit={handleBudgetSubmit}
                        style={styles.form}
                    >

                        <label style={styles.label}>
                            This month
                        </label>

                        <input
                            type="month"
                            value={currentMonth}
                            readOnly
                            style={styles.input}
                        />

                        <label style={styles.label}>
                            How much do you want to
                            spend?
                        </label>

                        <input
                            type="number"
                            placeholder="e.g. 50000"
                            value={budgetAmount}
                            onChange={(event) =>
                                setBudgetAmount(
                                    event.target.value
                                )
                            }
                            min="0"
                            step="0.01"
                            required
                            style={styles.input}
                        />

                        <button
                            type="submit"
                            style={styles.primaryButton}
                        >
                            Save Budget ✨
                        </button>

                    </form>

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            {editingExpenseId !== null
                                ? "🧸"
                                : "🌸"}
                        </span>

                        <h2>
                            {editingExpenseId !== null
                                ? "Edit Expense"
                                : "Add an Expense"}
                        </h2>

                    </div>

                    {editingExpenseId !== null && (

                        <div style={styles.editNotice}>

                            <strong>
                                You're editing an expense ✨
                            </strong>

                            <p>
                                Make your changes below
                                and save when you're ready.
                            </p>

                        </div>

                    )}

                    <form
                        onSubmit={
                            handleExpenseSubmit
                        }
                        style={styles.form}
                    >

                        <label style={styles.label}>
                            What did you spend on?
                        </label>

                        <input
                            type="text"
                            name="title"
                            placeholder="e.g. Lunch with friends"
                            value={
                                expenseForm.title
                            }
                            onChange={
                                handleExpenseChange
                            }
                            required
                            style={styles.input}
                        />

                        <label style={styles.label}>
                            Amount
                        </label>

                        <input
                            type="number"
                            name="amount"
                            placeholder="e.g. 250"
                            value={
                                expenseForm.amount
                            }
                            onChange={
                                handleExpenseChange
                            }
                            min="0"
                            step="0.01"
                            required
                            style={styles.input}
                        />

                        <label style={styles.label}>
                            Category
                        </label>

                        <select
                            name="category"
                            value={
                                expenseForm.category
                            }
                            onChange={
                                handleExpenseChange
                            }
                            required
                            style={styles.input}
                        >

                            <option value="">
                                Choose a category
                            </option>

                            <option value="Food">
                                🍜 Food
                            </option>

                            <option value="Transport">
                                🚗 Transport
                            </option>

                            <option value="Shopping">
                                🛍️ Shopping
                            </option>

                            <option value="Bills">
                                🧾 Bills
                            </option>

                            <option value="Entertainment">
                                🎬 Entertainment
                            </option>

                            <option value="Health">
                                🌿 Health
                            </option>

                            <option value="Other">
                                ✨ Other
                            </option>

                        </select>

                        <label style={styles.label}>
                            Date
                        </label>

                        <input
                            type="date"
                            name="expenseDate"
                            value={
                                expenseForm.expenseDate
                            }
                            onChange={
                                handleExpenseChange
                            }
                            required
                            style={styles.input}
                        />

                        <label style={styles.label}>
                            Little note
                        </label>

                        <textarea
                            name="description"
                            placeholder="Add a little note..."
                            value={
                                expenseForm.description
                            }
                            onChange={
                                handleExpenseChange
                            }
                            style={styles.textarea}
                        />

                        <button
                            type="submit"
                            style={
                                editingExpenseId !== null
                                    ? styles.updateButton
                                    : styles.primaryButton
                            }
                        >
                            {editingExpenseId !== null
                                ? "Update Expense ✨"
                                : "Add Expense 🌷"}
                        </button>

                        {editingExpenseId !== null && (

                            <button
                                type="button"
                                onClick={
                                    handleCancelEdit
                                }
                                style={
                                    styles.cancelButton
                                }
                            >
                                Cancel Edit
                            </button>

                        )}

                    </form>

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            🍰
                        </span>

                        <h2>
                            Spending by Category
                        </h2>

                    </div>

                    {chartData.length === 0 ? (

                        <div style={styles.emptyState}>
                            🌱
                            <p>
                                No expenses yet this month.
                            </p>
                        </div>

                    ) : (

                        <div
                            style={
                                styles.chartContainer
                            }
                        >

                            <ResponsiveContainer
                                width="100%"
                                height={350}
                            >

                                <PieChart>

                                    <Pie
                                        data={chartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        label
                                    >

                                        {chartData.map(
                                            (entry, index) => (

                                                <Cell
                                                    key={
                                                        "cell-" +
                                                        index
                                                    }
                                                    fill={
                                                        chartColors[
                                                            index %
                                                            chartColors.length
                                                        ]
                                                    }
                                                />

                                            )
                                        )}

                                    </Pie>

                                    <Tooltip
                                        formatter={(value) =>
                                            "₹" +
                                            Number(
                                                value
                                            ).toFixed(2)
                                        }
                                    />

                                    <Legend />

                                </PieChart>

                            </ResponsiveContainer>

                        </div>

                    )}

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            🌼
                        </span>

                        <h2>
                            Category-wise Spending
                        </h2>

                    </div>

                    {Object.keys(
                        categoryTotals
                    ).length === 0 ? (

                        <div style={styles.emptyState}>
                            🌸
                            <p>
                                Your spending categories
                                will appear here.
                            </p>
                        </div>

                    ) : (

                        Object.entries(
                            categoryTotals
                        ).map(
                            ([category, amount]) => {

                                const percentage =
                                    totalExpenses > 0
                                        ? (
                                            amount /
                                            totalExpenses
                                        ) * 100
                                        : 0;

                                return (

                                    <div
                                        key={category}
                                        style={
                                            styles.categoryRow
                                        }
                                    >

                                        <div
                                            style={
                                                styles.categoryHeader
                                            }
                                        >

                                            <strong>
                                                {category}
                                            </strong>

                                            <span>
                                                ₹
                                                {amount.toFixed(
                                                    2
                                                )}
                                            </span>

                                        </div>

                                        <div
                                            style={
                                                styles.progressBackground
                                            }
                                        >

                                            <div
                                                style={{
                                                    ...styles.progressBar,
                                                    width:
                                                        percentage +
                                                        "%"
                                                }}
                                            />

                                        </div>

                                        <p
                                            style={
                                                styles.percentage
                                            }
                                        >
                                            {percentage.toFixed(
                                                1
                                            )}
                                            %
                                        </p>

                                    </div>

                                );
                            }
                        )

                    )}

                </div>

                <div style={styles.card}>

                    <div style={styles.cardHeading}>

                        <span>
                            🧺
                        </span>

                        <h2>
                            My Expenses
                        </h2>

                    </div>

                    {currentMonthExpenses.length === 0 ? (

                        <div style={styles.emptyState}>
                            🧸
                            <p>
                                No expenses for this month
                                yet.
                            </p>
                        </div>

                    ) : (

                        currentMonthExpenses.map(
                            (expense) => (

                                <div
                                    key={expense.id}
                                    style={
                                        styles.expenseCard
                                    }
                                >

                                    <div
                                        style={
                                            styles.expenseTop
                                        }
                                    >

                                        <div>

                                            <h3
                                                style={
                                                    styles.expenseTitle
                                                }
                                            >
                                                {expense.title}
                                            </h3>

                                            <span
                                                style={
                                                    styles.categoryPill
                                                }
                                            >
                                                {expense.category}
                                            </span>

                                        </div>

                                        <div
                                            style={
                                                styles.expenseAmount
                                            }
                                        >
                                            ₹
                                            {Number(
                                                expense.amount
                                            ).toFixed(2)}
                                        </div>

                                    </div>

                                    <p
                                        style={
                                            styles.softText
                                        }
                                    >
                                        📅{" "}
                                        {expense.expenseDate}
                                    </p>

                                    <p
                                        style={
                                            styles.description
                                        }
                                    >
                                        {expense.description ||
                                            "No note added ♡"}
                                    </p>

                                    <div
                                        style={
                                            styles.expenseButtons
                                        }
                                    >

                                        <button
                                            onClick={() =>
                                                handleEditExpense(
                                                    expense
                                                )
                                            }
                                            style={
                                                styles.editButton
                                            }
                                        >
                                            ✏️ Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleDeleteExpense(
                                                    expense.id
                                                )
                                            }
                                            style={
                                                styles.deleteButton
                                            }
                                        >
                                            🗑 Delete
                                        </button>

                                    </div>

                                </div>

                            )
                        )

                    )}

                </div>

                <button
                    onClick={() => {

                        localStorage.removeItem(
                            "token"
                        );

                        localStorage.removeItem(
                            "user"
                        );

                        onLogout();

                    }}
                    style={
                        styles.logoutButton
                    }
                >
                    Log out gently ♡
                </button>

                <p style={styles.footer}>
                    made with ♡ for better budgeting
                </p>

            </div>

        </div>
    );
}

const styles = {

    page: {
        minHeight: "100vh",
        backgroundColor: "#faf7f8",
        padding: "35px 18px",
        fontFamily:
            "'Trebuchet MS', 'Segoe UI', sans-serif",
        color: "#665d63",
        position: "relative",
        overflow: "hidden"
    },

    container: {
        maxWidth: "900px",
        margin: "0 auto",
        position: "relative",
        zIndex: 2
    },

    doodleTopLeft: {
        position: "fixed",
        top: "40px",
        left: "25px",
        fontSize: "45px",
        color: "#e7c7d5",
        opacity: 0.7
    },

    doodleTopRight: {
        position: "fixed",
        top: "80px",
        right: "35px",
        fontSize: "55px",
        color: "#d4cde8",
        opacity: 0.65
    },

    doodleBottomLeft: {
        position: "fixed",
        bottom: "50px",
        left: "40px",
        fontSize: "45px",
        color: "#c9ddcf",
        opacity: 0.7
    },

    doodleBottomRight: {
        position: "fixed",
        bottom: "35px",
        right: "35px",
        fontSize: "50px",
        color: "#ecd0bd",
        opacity: 0.7
    },

    header: {
        backgroundColor: "#fffafd",
        padding: "30px",
        borderRadius: "28px",
        boxShadow:
            "0 8px 25px rgba(170,140,155,0.10)",
        border:
            "1px solid #f1e7ec",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },

    smallTitle: {
        color: "#c493aa",
        fontSize: "14px",
        letterSpacing: "2px",
        marginBottom: "8px"
    },

    title: {
        margin: 0,
        color: "#70656c",
        fontSize: "32px",
        fontWeight: "600",
        letterSpacing: "-0.5px"
    },

    subtitle: {
        marginBottom: 0,
        color: "#a79da3",
        fontSize: "15px"
    },

    headerDoodle: {
        fontSize: "55px",
        opacity: 0.8
    },

    userCard: {
        backgroundColor: "#fdf6f9",
        padding: "20px",
        borderRadius: "22px",
        marginTop: "20px",
        border: "1px solid #f2e3ea",
        display: "flex",
        gap: "18px",
        alignItems: "center"
    },

    userEmoji: {
        fontSize: "38px"
    },

    welcome: {
        margin: "0 0 8px",
        color: "#766873"
    },

    softText: {
        color: "#9b9197",
        fontSize: "14px",
        lineHeight: "1.6"
    },

    authSuccess: {
        color: "#82a38a",
        fontSize: "14px",
        fontWeight: "600"
    },

    summary: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "15px",
        marginTop: "20px"
    },

    summaryBox: {
        padding: "23px",
        borderRadius: "22px",
        textAlign: "center",
        border:
            "1px solid rgba(255,255,255,0.8)",
        boxShadow:
            "0 7px 20px rgba(170,140,155,0.08)"
    },

    summaryEmoji: {
        fontSize: "27px"
    },

    summaryNumber: {
        fontSize: "23px",
        fontWeight: "600",
        color: "#776b72"
    },

    card: {
        backgroundColor: "#fffdfd",
        padding: "26px",
        borderRadius: "24px",
        marginTop: "20px",
        border: "1px solid #f0e8ec",
        boxShadow:
            "0 7px 22px rgba(170,140,155,0.08)"
    },

    cardHeading: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "10px"
    },

    label: {
        color: "#8c7e86",
        fontSize: "14px",
        fontWeight: "600",
        marginTop: "5px"
    },

    input: {
        padding: "13px 15px",
        border: "1px solid #eadfe5",
        borderRadius: "14px",
        fontSize: "15px",
        boxSizing: "border-box",
        backgroundColor: "#fffafb",
        color: "#665d63",
        outline: "none"
    },

    textarea: {
        padding: "13px 15px",
        border: "1px solid #eadfe5",
        borderRadius: "14px",
        minHeight: "90px",
        fontSize: "15px",
        resize: "vertical",
        backgroundColor: "#fffafb",
        color: "#665d63",
        outline: "none"
    },

    primaryButton: {
        padding: "13px 18px",
        border: "none",
        borderRadius: "15px",
        cursor: "pointer",
        backgroundColor: "#c99ab1",
        color: "white",
        fontSize: "15px",
        fontWeight: "600",
        marginTop: "7px",
        boxShadow:
            "0 5px 12px rgba(201,154,177,0.22)"
    },

    updateButton: {
        padding: "13px 18px",
        border: "none",
        borderRadius: "15px",
        cursor: "pointer",
        backgroundColor: "#a9a2ca",
        color: "white",
        fontSize: "15px",
        fontWeight: "600",
        marginTop: "7px"
    },

    cancelButton: {
        padding: "12px",
        border: "none",
        borderRadius: "15px",
        cursor: "pointer",
        backgroundColor: "#eee9ec",
        color: "#81767d",
        fontSize: "14px"
    },

    editNotice: {
        backgroundColor: "#f5f1fb",
        padding: "15px 17px",
        borderRadius: "15px",
        marginBottom: "15px",
        color: "#857c9a"
    },

    statusPill: {
        display: "inline-block",
        padding: "8px 15px",
        borderRadius: "20px",
        fontWeight: "600",
        marginBottom: "10px"
    },

    progressBackground: {
        width: "100%",
        height: "12px",
        backgroundColor: "#f0ebee",
        borderRadius: "20px",
        overflow: "hidden",
        marginTop: "10px"
    },

    budgetProgressBar: {
        height: "100%",
        borderRadius: "20px",
        transition: "width 0.4s ease"
    },

    progressBar: {
        height: "100%",
        backgroundColor: "#c9a7ba",
        borderRadius: "20px",
        transition: "width 0.4s ease"
    },

    chartContainer: {
        width: "100%",
        height: "350px"
    },

    categoryRow: {
        marginBottom: "22px"
    },

    categoryHeader: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "7px",
        color: "#81757c"
    },

    percentage: {
        marginTop: "6px",
        fontSize: "12px",
        color: "#aaa0a6"
    },

    expenseCard: {
        border: "1px solid #eee4e9",
        padding: "19px",
        borderRadius: "19px",
        marginBottom: "13px",
        backgroundColor: "#fffafb"
    },

    expenseTop: {
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        alignItems: "flex-start"
    },

    expenseTitle: {
        margin: "0 0 8px",
        color: "#756970",
        fontWeight: "600"
    },

    categoryPill: {
        display: "inline-block",
        backgroundColor: "#f1e8ef",
        color: "#a27f91",
        padding: "5px 10px",
        borderRadius: "15px",
        fontSize: "12px"
    },

    expenseAmount: {
        color: "#9b7590",
        fontWeight: "700",
        fontSize: "18px"
    },

    description: {
        color: "#9c9298",
        fontSize: "14px",
        fontStyle: "italic"
    },

    expenseButtons: {
        display: "flex",
        gap: "10px",
        marginTop: "15px"
    },

    editButton: {
        padding: "9px 15px",
        border: "none",
        borderRadius: "13px",
        cursor: "pointer",
        backgroundColor: "#d8d1e8",
        color: "#716b83",
        fontWeight: "600"
    },

    deleteButton: {
        padding: "9px 15px",
        border: "none",
        borderRadius: "13px",
        cursor: "pointer",
        backgroundColor: "#f1dada",
        color: "#a27676",
        fontWeight: "600"
    },

    success: {
        marginTop: "18px",
        padding: "13px 17px",
        borderRadius: "15px",
        backgroundColor: "#eef7f0",
        color: "#78947e",
        fontWeight: "600"
    },

    error: {
        marginTop: "18px",
        padding: "13px 17px",
        borderRadius: "15px",
        backgroundColor: "#fff1f1",
        color: "#b27f7f",
        fontWeight: "600"
    },

    emptyState: {
        textAlign: "center",
        padding: "35px",
        color: "#aaa0a6",
        fontSize: "15px"
    },

    logoutButton: {
        display: "block",
        margin: "30px auto 10px",
        padding: "12px 25px",
        border: "1px solid #eadfe5",
        borderRadius: "18px",
        cursor: "pointer",
        backgroundColor: "#fffafb",
        color: "#998d94",
        fontSize: "14px"
    },

    footer: {
        textAlign: "center",
        color: "#c0b5bb",
        fontSize: "12px",
        marginTop: "20px"
    }
};

export default Dashboard;