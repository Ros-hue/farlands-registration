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
    </main>
  );
}
