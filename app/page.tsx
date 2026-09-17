import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b0b0b",
        color: "white",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "64px", margin: 0 }}>
        FARLANDS
      </h1>

      <p style={{ fontSize: "24px", marginTop: "20px" }}>
        is on its way...
      </p>

      <p style={{ fontSize: "18px", opacity: 0.7 }}>
        Stay tuned!
      </p>

      <div style={{ marginTop: "32px", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/register"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            backgroundColor: "#a5df7a",
            color: "#091208",
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          Register Team
        </Link>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            backgroundColor: "transparent",
            color: "#a5df7a",
            fontWeight: 700,
            textDecoration: "none",
            borderRadius: "4px",
            border: "1px solid #a5df7a",
            fontSize: "16px",
          }}
        >
          Payment Portal / Login
        </Link>
      </div>
    </main>
  );
}
